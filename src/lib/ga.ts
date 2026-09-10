/**
 * Google Analytics 4, partea din browser.
 *
 * Aceeași regulă ca la Meta Pixel: nimic nu se încarcă fără acord. Când
 * acordul vine, se declară Consent Mode v2 (cerut de Google în UE) și abia
 * apoi se încarcă gtag.js. Evenimentele Meta au aici un echivalent GA4, ca
 * rapoartele din cele două să spună aceeași poveste.
 */

import { readConsent } from "./meta/consent";
import type { StandardEvent } from "./meta/pixel";

export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export function gaEnabled(): boolean {
  return Boolean(GA_ID) && readConsent() === "granted";
}

/** Încarcă gtag.js o singură dată, cu consimțământul declarat înainte. */
export function loadGa() {
  if (typeof window === "undefined" || !GA_ID) return;
  if (window.gtag) return;

  window.dataLayer = window.dataLayer ?? [];
  const gtag: Gtag = function () {
    // gtag citește `arguments`, nu un array: trebuie exact forma asta.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag = gtag;

  // Consent Mode v2. Acordul e deja dat când ajungem aici (altfel nu se
  // încarcă nimic), dar declarația explicită e ceea ce Google verifică.
  gtag("consent", "default", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted",
  });
  gtag("js", new Date());
  // `send_page_view: false`: PageView-ul îl trimitem noi, la fiecare navigare,
  // sincron cu pixelul Meta.
  gtag("config", GA_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

export function gaPageView() {
  if (!gaEnabled() || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_location: location.href,
    page_title: document.title,
  });
}

/**
 * Traducerea evenimentelor Meta în evenimente recomandate GA4. Parametrii
 * relevanți (valoare, monedă, articole) se păstrează.
 */
const GA_EVENT: Record<StandardEvent, string | null> = {
  PageView: null, // are funcția lui, mai sus
  ViewContent: "view_item",
  CompleteRegistration: "sign_up",
  InitiateCheckout: "begin_checkout",
  Purchase: "purchase",
  Lead: "generate_lead",
};

export function gaTrack(event: StandardEvent, params: Record<string, unknown> = {}) {
  const name = GA_EVENT[event];
  if (!name || !gaEnabled() || !window.gtag) return;

  const ids = Array.isArray(params.content_ids) ? (params.content_ids as string[]) : [];
  window.gtag("event", name, {
    value: params.value,
    currency: params.currency,
    method: event === "CompleteRegistration" ? "email" : undefined,
    items: ids.length
      ? ids.map((id) => ({ item_id: id, item_name: String(params.content_name ?? id) }))
      : undefined,
  });
}
