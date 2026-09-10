import { createHash } from "node:crypto";

import { parseConsent, CONSENT_COOKIE, type Consent } from "./consent";

/**
 * Meta Conversions API — evenimente trimise de pe server.
 *
 * Browserul e nesigur: ad-blockere, Safari, ferestre închise înainte de
 * `success_url`. Cumpărarea se raportează de aici, din webhook-ul Stripe,
 * singurul loc care știe sigur că banii au intrat. Același `event_id` ca în
 * browser face ca Meta să nu numere de două ori.
 *
 * Nimic nu pleacă fără consimțământ și nimic nu blochează cererea principală:
 * o eroare aici se loghează și atât.
 */

const API_VERSION = "v21.0";
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? "";
/** Din Events Manager → Test events; setat doar cât timp verifici. */
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;

export function capiConfigured(): boolean {
  return Boolean(PIXEL_ID && ACCESS_TOKEN);
}

/** Meta cere datele personale hash-uite SHA-256, normalizate (mic, fără spații). */
function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/**
 * Ce se poate ști despre vizitator în momentul evenimentului. Cu cât mai
 * multe, cu atât Meta potrivește mai bine evenimentul cu contul persoanei.
 */
export interface MetaClient {
  consent: Consent | null;
  ip?: string | null;
  userAgent?: string | null;
  /** Cookie-urile `_fbp` și `_fbc`, puse de pixel în browser. */
  fbp?: string | null;
  fbc?: string | null;
  sourceUrl?: string | null;
}

/** Citește tot ce e util despre client dintr-o cerere HTTP. */
export function readMetaClient(request: Request): MetaClient {
  const cookies = parseCookies(request.headers.get("cookie"));
  const forwarded = request.headers.get("x-forwarded-for");
  return {
    consent: parseConsent(cookies[CONSENT_COOKIE]),
    ip: forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
    fbp: cookies._fbp ?? null,
    fbc: cookies._fbc ?? null,
    sourceUrl: request.headers.get("referer"),
  };
}

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export interface MetaEvent {
  name: "PageView" | "ViewContent" | "CompleteRegistration" | "InitiateCheckout" | "Purchase";
  /** Același ID ca în browser, pentru deduplicare. */
  eventId: string;
  /** Secunde Unix; implicit acum. */
  eventTime?: number;
  email?: string | null;
  /** ID-ul intern al utilizatorului; hash-uit, ajută la potrivire. */
  externalId?: string | null;
  client: MetaClient;
  customData?: Record<string, unknown>;
}

/**
 * Trimite un eveniment. Returnează `true` doar dacă Meta l-a acceptat.
 * Nu aruncă niciodată: apelantul are treabă mai importantă decât raportarea.
 */
export async function sendMetaEvent(event: MetaEvent): Promise<boolean> {
  if (!capiConfigured()) return false;
  if (event.client.consent !== "granted") return false;

  const userData: Record<string, unknown> = {};
  if (event.email) userData.em = [sha256(event.email)];
  if (event.externalId) userData.external_id = [sha256(event.externalId)];
  if (event.client.ip) userData.client_ip_address = event.client.ip;
  if (event.client.userAgent) userData.client_user_agent = event.client.userAgent;
  if (event.client.fbp) userData.fbp = event.client.fbp;
  if (event.client.fbc) userData.fbc = event.client.fbc;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event.name,
        event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: "website",
        event_source_url: event.client.sourceUrl ?? undefined,
        user_data: userData,
        custom_data: event.customData,
      },
    ],
  };
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) {
      console.error("[meta-capi]", event.name, res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[meta-capi]", event.name, error);
    return false;
  }
}
