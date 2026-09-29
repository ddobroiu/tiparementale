// TikTok Events API (server side): "CompletePayment" after a confirmed payment,
// complementing the browser pixel (lib/tiktok.ts). Sent ONLY when the buyer had
// accepted marketing cookies when the checkout was created: that choice, plus the
// _ttp cookie, ttclid, IP and user agent, travel in the Stripe session metadata
// (tiktokCheckoutMetadata) and are read back in fulfilment (sendTikTokPurchase).
// No consent -> nothing is sent. Server only. Deduplicated with the pixel through event_id =
// purchase id (components/TikTokPurchase.tsx sends the same id).
// Personal data is SHA-256 hashed (email trimmed + lowercased, phone in E.164,
// external_id = user id). Never throws, 8 s timeout; errors are logged, and only
// token/permission errors are reported to mydashboard.
// Docs: https://business-api.tiktok.com/portal/docs?id=1771100865818625 (Events API 2.0)
import { createHash } from "node:crypto";
import { alerta } from "@/lib/alerts";

const ENDPOINT: string = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
const DEFAULT_PIXEL_ID: string = "DATG2MRC77U0AVP512OG";
const ALERT_PREFIX: string = "Tipare Mentale";

// Stripe metadata keys (values max 500 chars)
const META = { consent: "tt_consent", ttp: "tt_ttp", ttclid: "tt_ttclid", ip: "tt_ip", ua: "tt_ua" } as const;

export function tiktokPixelId(): string {
  return process.env.TIKTOK_PIXEL_ID || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || DEFAULT_PIXEL_ID;
}

function clean(value: string | null | undefined, max: number): string | undefined {
  const v: string = (value ?? "").trim();
  return v ? v.slice(0, max) : undefined;
}

/** First IP of x-forwarded-for (behind the proxy), else x-real-ip. */
export function clientIp(headers: Headers): string | undefined {
  const forwarded: string | undefined = headers.get("x-forwarded-for")?.split(",")[0];
  return clean(forwarded ?? headers.get("x-real-ip"), 64);
}

/**
 * Metadata to put on the Stripe Checkout session. Empty without marketing consent,
 * so nothing TikTok-related is stored or sent for buyers who did not accept.
 */
export function tiktokCheckoutMetadata(input: {
  marketing: boolean;
  ttp?: string | null;
  ttclid?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): Record<string, string> {
  if (!input.marketing) return {};
  const meta: Record<string, string> = { [META.consent]: "1" };
  const ttp = clean(input.ttp, 200);
  const ttclid = clean(input.ttclid, 500);
  const ip = clean(input.ip, 64);
  const ua = clean(input.userAgent, 500);
  if (ttp) meta[META.ttp] = ttp;
  if (ttclid) meta[META.ttclid] = ttclid;
  if (ip) meta[META.ip] = ip;
  if (ua) meta[META.ua] = ua;
  return meta;
}

/** True when the session metadata carries the buyer's marketing consent. */
export function tiktokConsentFromMetadata(metadata: Record<string, string> | null | undefined): boolean {
  return metadata?.[META.consent] === "1";
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Phone to E.164 (+40... for Romanian national numbers); undefined when unusable. */
export function toE164(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  let p: string = phone.trim().replace(/[\s().-]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  if (!p.startsWith("+")) {
    if (/^0\d{9}$/.test(p)) p = "+40" + p.slice(1);
    else if (/^40\d{9}$/.test(p)) p = "+" + p;
    else return undefined;
  }
  return /^\+\d{8,15}$/.test(p) ? p : undefined;
}

export interface TikTokPurchase {
  // Same id the browser pixel sends as event_id (the order id)
  eventId: string;
  value: number;
  currency: string;
  contents: { content_id: string; content_name?: string; quantity: number; price: number }[];
  pageUrl?: string;
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  // Stripe session metadata (consent, _ttp, ttclid, ip, user agent)
  metadata?: Record<string, string> | null;
  eventTime?: number;
}

/** The request body (exported for tests). */
export function buildTikTokPurchasePayload(p: TikTokPurchase): Record<string, unknown> {
  const m: Record<string, string> = p.metadata ?? {};
  const user: Record<string, string> = {};
  const email: string | undefined = p.email?.trim().toLowerCase();
  if (email) user.email = sha256(email);
  const phone: string | undefined = toE164(p.phone);
  if (phone) user.phone = sha256(phone);
  if (p.externalId) user.external_id = sha256(String(p.externalId));
  if (m[META.ip]) user.ip = m[META.ip];
  if (m[META.ua]) user.user_agent = m[META.ua];
  if (m[META.ttp]) user.ttp = m[META.ttp];
  if (m[META.ttclid]) user.ttclid = m[META.ttclid];

  const event: Record<string, unknown> = {
    event: "CompletePayment",
    event_id: p.eventId,
    event_time: p.eventTime ?? Math.floor(Date.now() / 1000),
    user,
    properties: {
      currency: p.currency.toUpperCase(),
      value: Math.round(p.value * 100) / 100,
      content_type: "product",
      contents: p.contents,
      order_id: p.eventId,
    },
  };
  if (p.pageUrl) event.page = { url: p.pageUrl };

  const body: Record<string, unknown> = {
    event_source: "web",
    event_source_id: tiktokPixelId(),
    data: [event],
  };
  const testCode: string | undefined = process.env.TIKTOK_TEST_EVENT_CODE;
  if (testCode) body.test_event_code = testCode;
  return body;
}

function isAuthError(status: number, code: number | undefined, message: string): boolean {
  return status === 401 || status === 403 || code === 40001 || code === 40104 || code === 40105
    || /access[ _-]?token|permission|unauthori[sz]ed|pixel.*(not exist|invalid)/i.test(message);
}

/**
 * Sends CompletePayment. No-op without TIKTOK_EVENTS_TOKEN or without the buyer's
 * marketing consent in the metadata. Resolves to true when TikTok answered code 0.
 * Never throws. Call once per order (after the fulfilment claim succeeded).
 */
export async function sendTikTokPurchase(p: TikTokPurchase): Promise<boolean> {
  const token: string | undefined = process.env.TIKTOK_EVENTS_TOKEN;
  if (!token || !tiktokConsentFromMetadata(p.metadata)) return false;
  try {
    const res: Response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": token },
      body: JSON.stringify(buildTikTokPurchasePayload(p)),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => null)) as { code?: number; message?: string } | null;
    if (res.ok && data?.code === 0) return true;
    const message: string = `HTTP ${res.status}, code ${data?.code ?? "?"}: ${data?.message ?? ""}`;
    console.error("[tiktok-events] CompletePayment rejected:", p.eventId, message);
    if (isAuthError(res.status, data?.code, data?.message ?? "")) {
      void alerta("error", "tiktok-events", `${ALERT_PREFIX}: TikTok Events API a refuzat token-ul/pixelul (${message})`);
    }
  } catch (error: unknown) {
    console.error("[tiktok-events] CompletePayment failed:", p.eventId, error instanceof Error ? error.message : error);
  }
  return false;
}
