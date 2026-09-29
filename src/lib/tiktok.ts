/**
 * TikTok Pixel, incarcat DOAR dupa acordul pentru cookie-uri de marketing
 * (aceeasi categorie ca Meta Pixel). Nu se incarca pe caile excluse din
 * lib/clarity.ts (harta/aplicatia, setari, autentificare, admin), cu o singura
 * exceptie: intoarcerea de la Stripe pe /harta, unde se incarca doar ca sa
 * trimita CompletePayment (fara page()).
 *
 * La retragerea acordului: `revokeConsent()` si stergerea cookie-urilor
 * _ttp / _tt_enable_cookie / tt_ttclid; la redare: `grantConsent()`.
 */

import { isClarityExcludedPath } from "./clarity";
import { hasConsent } from "./meta/consent";

export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "DATG2MRC77U0AVP512OG";

// tt_ttclid: id-ul de click TikTok din URL-ul unei reclame, pastrat (doar cu acord de
// marketing) ca plata sa-l poata trimite prin Events API (lib/tiktok-events.ts, server)
const TTCLID_COOKIE = "tt_ttclid";
const TIKTOK_COOKIES = ["_ttp", "_tt_enable_cookie", TTCLID_COOKIE];

/** Pastreaza ?ttclid= din URL 30 de zile (apelat doar cu acord de marketing). */
function captureTtclid() {
  try {
    const ttclid = new URLSearchParams(location.search).get("ttclid");
    if (ttclid && ttclid.length <= 500) {
      document.cookie = `${TTCLID_COOKIE}=${encodeURIComponent(ttclid)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    }
  } catch {
    // nu strica niciodata pagina
  }
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ttq?: any;
    TiktokAnalyticsObject?: string;
    __ttqLoaded?: boolean;
  }
}

/** Calea pentru care s-a trimis ultimul page(); evita dublarea la prima incarcare. */
let lastPagePath: string | null = null;
let granted = false;

export function tiktokLoaded(): boolean {
  return typeof window !== "undefined" && Boolean(window.__ttqLoaded && window.ttq);
}

/** Codul de baza oficial TikTok, parametrizat doar cu ID-ul, fara load/page. */
/* eslint-disable */
function injectBaseCode() {
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t: any,e: any){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t: any){for(
    var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e: any,n: any){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=d.createElement("script")
    ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=d.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  })(window, document, "ttq");
}
/* eslint-enable */

/**
 * Incarca pixelul (o singura data), doar cu acord de marketing. Pe caile
 * excluse nu face nimic, cu exceptia `allowExcluded` (pagina de plata reusita),
 * cand se incarca fara page().
 */
export function loadTikTok(opts: { pathname?: string | null; allowExcluded?: boolean } = {}): boolean {
  if (!TIKTOK_PIXEL_ID || typeof document === "undefined") return false;
  if (!hasConsent("marketing")) return false;
  captureTtclid();
  const path = opts.pathname ?? location.pathname;
  const excluded = isClarityExcludedPath(path);
  if (excluded && !opts.allowExcluded) return false;

  if (!window.__ttqLoaded) {
    injectBaseCode();
    const ttq = window.ttq;
    ttq.holdConsent();
    ttq.load(TIKTOK_PIXEL_ID);
    if (!excluded) {
      ttq.page();
      lastPagePath = path;
    }
    ttq.grantConsent();
    window.__ttqLoaded = true;
    granted = true;
  } else if (!granted) {
    window.ttq?.grantConsent();
    granted = true;
  }
  return true;
}

/** La fiecare schimbare de pagina (navigare client): page(), doar cu acord si nu pe caile excluse. */
export function syncTikTokWithPath(pathname: string | null | undefined, marketing: boolean) {
  if (!marketing || typeof document === "undefined") return;
  const path = pathname || "/";
  if (isClarityExcludedPath(path)) return;
  if (!tiktokLoaded()) {
    loadTikTok({ pathname: path });
    return;
  }
  if (!granted) {
    window.ttq.grantConsent();
    granted = true;
  }
  if (lastPagePath === path) return;
  lastPagePath = path;
  window.ttq.page();
}

/** La refuz / retragerea acordului: revokeConsent() si stergerea cookie-urilor TikTok. */
export function revokeTikTok() {
  if (typeof document === "undefined") return;
  if (tiktokLoaded() && granted) window.ttq.revokeConsent();
  granted = false;
  const host = location.hostname.replace(/^www\./, "");
  for (const name of TIKTOK_COOKIES) {
    for (const d of ["", `; Domain=${host}`, `; Domain=.${host}`, `; Domain=${location.hostname}`]) {
      document.cookie = `${name}=; Path=/; Max-Age=0${d}`;
    }
  }
}

export interface TikTokContent {
  content_id: string;
  content_name?: string;
  quantity?: number;
  price?: number;
}

/** Eveniment TikTok; nu face nimic fara acord de marketing sau fara pixel incarcat. */
export function trackTikTok(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !TIKTOK_PIXEL_ID) return;
  if (!hasConsent("marketing") || !tiktokLoaded() || !granted) return;
  window.ttq.track(event, params);
}
