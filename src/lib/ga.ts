/**
 * Google Analytics 4, partea din browser.
 *
 * Aceeași regulă ca la Meta Pixel: nimic nu se încarcă fără acord. Când
 * acordul vine, se declară Consent Mode v2 (cerut de Google în UE) și abia
 * apoi se încarcă gtag.js. Evenimentele Meta au aici un echivalent GA4, ca
 * rapoartele din cele două să spună aceeași poveste.
 */

import { hasConsent } from "./meta/consent";
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
  return Boolean(GA_ID) && hasConsent("analytics");
}

/** Stările Consent Mode v2 pentru o alegere din banner. */
function consentState(choice: { analytics: boolean; marketing: boolean }) {
  const ads = choice.marketing ? "granted" : "denied";
  return {
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
    analytics_storage: choice.analytics ? "granted" : "denied",
  };
}

/** Alegerea schimbată după încărcare: Google o aplică fără reîncărcare. */
export function gaConsentUpdate(choice: { analytics: boolean; marketing: boolean }) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("consent", "update", consentState(choice));
}

/**
 * Încarcă gtag.js o singură dată, doar cu acord pentru analiză. Consent Mode
 * v2: întâi totul „denied” (implicit), apoi alegerea reală („update”), abia
 * apoi `config`.
 */
export function loadGa(choice: { analytics: boolean; marketing: boolean }) {
  if (typeof window === "undefined" || !GA_ID) return;
  if (window.gtag) {
    gaConsentUpdate(choice);
    return;
  }
  if (!choice.analytics) return;

  window.dataLayer = window.dataLayer ?? [];
  const gtag: Gtag = function () {
    // gtag citește `arguments`, nu un array: trebuie exact forma asta.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag = gtag;

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
  gtag("consent", "update", consentState(choice));
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
