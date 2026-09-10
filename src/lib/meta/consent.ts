/**
 * Consimțământul pentru cookie-uri de marketing (Meta Pixel).
 *
 * Alegerea se ține într-un cookie, nu doar în localStorage: serverul are
 * nevoie de ea ca să știe dacă poate trimite evenimente prin Conversions API.
 * Fără acord explicit nu se încarcă nimic de la Meta și nu se trimite nimic.
 *
 * Fișierul e importat și din componente client, și din rute de server, deci
 * nu are voie să atingă `document` decât în funcțiile marcate ca atare.
 */

export const CONSENT_COOKIE = "tm_consent";
export const CONSENT_EVENT = "tm-consent";
/** Un an: cât ține și obligația de a re-întreba, în practică. */
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export type Consent = "granted" | "denied";

export function parseConsent(value: string | undefined | null): Consent | null {
  return value === "granted" || value === "denied" ? value : null;
}

/** Doar în browser. */
export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  return parseConsent(match?.[1]);
}

/** Doar în browser. Anunță și restul paginii (pixelul ascultă). */
export function writeConsent(value: Consent) {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: value }));
}
