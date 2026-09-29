/**
 * Consimțământul pentru cookie-uri, pe categorii.
 *
 * - necesare: sesiunea și alegerea de aici; mereu active, nu se cer;
 * - analitice: Google Analytics 4 și mydashboard.ro (vizite, surse de trafic);
 * - marketing: Meta Pixel și Conversions API, TikTok Pixel.
 *
 * Alegerea se ține într-un cookie, nu doar în localStorage: serverul are
 * nevoie de ea ca să știe dacă poate trimite evenimente prin Conversions API
 * și dacă poate lega plata de vizitatorul mydashboard. Forma valorii:
 * `<versiune>.a<0|1>.m<0|1>.t<ms>` — versiunea, categoriile, momentul.
 * O valoare veche (de dinainte de categorii) sau cu altă versiune nu contează:
 * bannerul întreabă din nou.
 *
 * Fișierul e importat și din componente client, și din rute de server, deci
 * nu are voie să atingă `document` decât în funcțiile marcate ca atare.
 */

export const CONSENT_COOKIE = "tm_consent";
/** Se emite după fiecare alegere; detaliul e `ConsentChoice`. */
export const CONSENT_EVENT = "tm-consent";
/** Cere bannerului să se redeschidă (linkul „Setări cookies”). */
export const CONSENT_OPEN_EVENT = "tm-consent-open";
/** Se schimbă doar când se schimbă categoriile sau furnizorii din ele. */
export const CONSENT_VERSION = "2026-09-29";
/** Șase luni: după aceea întrebăm din nou. */
const CONSENT_MAX_AGE = 60 * 60 * 24 * 182;

/** Acordul pentru Meta (categoria marketing), în forma salvată în Stripe. */
export type Consent = "granted" | "denied";

export interface ConsentChoice {
  analytics: boolean;
  marketing: boolean;
  /** Momentul alegerii, ms Unix. */
  at: number;
}

const PATTERN = /^(\d{4}-\d{2}-\d{2})\.a([01])\.m([01])\.t(\d{1,15})$/;

export function parseConsentCookie(value: string | undefined | null): ConsentChoice | null {
  const match = value ? PATTERN.exec(value) : null;
  if (!match || match[1] !== CONSENT_VERSION) return null;
  return { analytics: match[2] === "1", marketing: match[3] === "1", at: Number(match[4]) };
}

export function serializeConsent(choice: ConsentChoice): string {
  return `${CONSENT_VERSION}.a${choice.analytics ? 1 : 0}.m${choice.marketing ? 1 : 0}.t${choice.at}`;
}

/** Acordul de marketing (Meta) dedus din cookie; `null` dacă nu s-a răspuns. */
export function marketingConsent(cookieValue: string | undefined | null): Consent | null {
  const choice = parseConsentCookie(cookieValue);
  if (!choice) return null;
  return choice.marketing ? "granted" : "denied";
}

/** Pentru valorile deja salvate ca text (metadatele Stripe). */
export function parseConsent(value: string | undefined | null): Consent | null {
  return value === "granted" || value === "denied" ? value : null;
}

/** Doar în browser. Valoarea brută, stabilă între apeluri (pentru `useSyncExternalStore`). */
export function readConsentRaw(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  return match?.[1] ?? null;
}

/** Doar în browser. */
export function readConsent(): ConsentChoice | null {
  return parseConsentCookie(readConsentRaw());
}

export function hasConsent(category: "analytics" | "marketing"): boolean {
  return Boolean(readConsent()?.[category]);
}

/** Doar în browser. Anunță și restul paginii (scripturile ascultă). */
export function writeConsent(value: { analytics: boolean; marketing: boolean }) {
  if (typeof document === "undefined") return;
  const choice: ConsentChoice = { ...value, at: Date.now() };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${CONSENT_COOKIE}=${serializeConsent(choice)}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_EVENT, { detail: choice }));
}

/** Doar în browser. Redeschide bannerul, cu alegerea curentă precompletată. */
export function openConsentSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
