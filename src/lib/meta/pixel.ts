/**
 * Meta Pixel, partea din browser.
 *
 * Toate apelurile trec pe aici, nu direct prin `fbq`: dacă pixelul nu e
 * configurat sau vizitatorul a refuzat cookie-urile, funcțiile de mai jos nu
 * fac nimic, iar restul codului nu trebuie să verifice nimic.
 *
 * Fiecare eveniment primește un `eventID`. Același ID pleacă și către server
 * (Conversions API), iar Meta le recunoaște ca fiind unul singur. Fără el, o
 * cumpărare s-ar număra de două ori.
 */

import { gaPageView, gaTrack } from "../ga";
import { trackTikTok } from "../tiktok";
import { hasConsent } from "./consent";

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

type Fbq = ((...args: unknown[]) => void) & { loaded?: boolean };

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export type StandardEvent =
  | "PageView"
  | "ViewContent"
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "Purchase"
  | "Lead";

export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Pixelul e activ doar cu ID configurat și acord dat. */
export function pixelEnabled(): boolean {
  return Boolean(PIXEL_ID) && hasConsent("marketing");
}

/**
 * Încarcă scriptul Meta o singură dată. Este exact codul de bază recomandat de
 * Meta, scris ca funcție ca să-l putem apela abia după consimțământ.
 */
export function loadPixel() {
  if (typeof window === "undefined" || !PIXEL_ID) return;
  if (window.fbq) return;

  const fbq: Fbq = function (...args: unknown[]) {
    const self = fbq as Fbq & { callMethod?: (...a: unknown[]) => void; queue: unknown[] };
    if (self.callMethod) self.callMethod(...args);
    else self.queue.push(args);
  };
  const q = fbq as Fbq & { push: Fbq; queue: unknown[]; version: string };
  q.push = fbq;
  q.loaded = true;
  q.version = "2.0";
  q.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", PIXEL_ID);
}

/**
 * Acordul retras (sau redat) fără reîncărcarea paginii: dacă pixelul e deja
 * încărcat, nu mai trimite nimic până la un nou „grant”.
 */
export function setPixelConsent(granted: boolean) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("consent", granted ? "grant" : "revoke");
}

/**
 * Funcțiile de mai jos vorbesc și cu Google Analytics (și, pentru
 * ViewContent / InitiateCheckout, cu TikTok Pixel): un singur apel din
 * componente, toate platformele primesc același eveniment.
 */
export function trackPageView() {
  if (pixelEnabled() && window.fbq) window.fbq("track", "PageView");
  gaPageView();
}

export function track(
  event: StandardEvent,
  params: Record<string, unknown> = {},
  eventId: string = newEventId(),
): string {
  if (pixelEnabled() && window.fbq) {
    window.fbq("track", event, params, { eventID: eventId });
  }
  gaTrack(event, params);
  tiktokTrack(event, params);
  return eventId;
}

/** Evenimentele cu echivalent TikTok; trackTikTok nu face nimic fără acord de marketing. */
function tiktokTrack(event: StandardEvent, params: Record<string, unknown>) {
  if (event !== "ViewContent" && event !== "InitiateCheckout") return;
  const ids = Array.isArray(params.content_ids) ? (params.content_ids as string[]) : [];
  const value = typeof params.value === "number" ? params.value : undefined;
  trackTikTok(event, {
    value,
    currency: typeof params.currency === "string" ? params.currency : "RON",
    content_type: "product",
    contents: ids.length
      ? ids.map((id) => ({
          content_id: id,
          content_name: id,
          quantity: 1,
          ...(ids.length === 1 && value !== undefined ? { price: value } : {}),
        }))
      : undefined,
  });
}
