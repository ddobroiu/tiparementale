/**
 * Microsoft Clarity (harti de interactiune si inregistrari de sesiune, cu
 * continutul mascat), incarcat DOAR dupa acordul pentru cookie-uri analitice,
 * ca GA4 si trackerul mydashboard (vezi MetaPixel). Nu se incarca niciodata
 * pe paginile unde se introduc date personale (aplicatia/harta, setari, autentificare,
 * admin); daca ruleaza deja si vizitatorul ajunge pe una, inregistrarea se
 * opreste ("pause") si se reia la iesire.
 */

export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "yplamurxjy";

const SCRIPT_ID = "clarity-js";

/** Cai excluse (cu tot ce e sub ele). */
export const CLARITY_EXCLUDED_PATHS = ["/admin", "/harta", "/setari", "/intra", "/resetare"];

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    clarity?: ClarityFn;
    __clarityPaused?: boolean;
  }
}

export function isClarityExcludedPath(pathname: string | null | undefined): boolean {
  const p = pathname || "/";
  return CLARITY_EXCLUDED_PATHS.some((x) => p === x || p.startsWith(`${x}/`));
}

/** Incarca tagul (o singura data) si transmite acordul pentru statistica. */
export function loadClarity(pathname?: string | null) {
  if (!CLARITY_ID || typeof document === "undefined") return;
  if (isClarityExcludedPath(pathname ?? location.pathname)) return;
  if (!document.getElementById(SCRIPT_ID)) {
    // snippetul standard Clarity
    window.clarity =
      window.clarity ||
      function clarity(...args: unknown[]) {
        (window.clarity!.q = window.clarity!.q || []).push(args);
      };
    const script = document.createElement("script");
    script.async = true;
    script.id = SCRIPT_ID;
    script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
    document.head.appendChild(script);
  } else if (window.__clarityPaused) {
    window.clarity?.("resume");
  }
  window.__clarityPaused = false;
  window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
}

/** La fiecare schimbare de pagina: pauza pe caile excluse, (re)incarcare in rest, doar cu acord. */
export function syncClarityWithPath(pathname: string | null | undefined, analytics: boolean) {
  if (!CLARITY_ID || typeof document === "undefined") return;
  if (isClarityExcludedPath(pathname)) {
    if (window.clarity && !window.__clarityPaused) {
      window.clarity("pause");
      window.__clarityPaused = true;
    }
    return;
  }
  if (analytics) loadClarity(pathname);
}

/** La refuz / retragerea acordului: semnal „denied” si stergerea cookie-urilor _clck / _clsk. */
export function revokeClarity() {
  if (typeof document === "undefined") return;
  window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
  const host = location.hostname.replace(/^www\./, "");
  for (const name of ["_clck", "_clsk"]) {
    for (const d of ["", `; Domain=${host}`, `; Domain=.${host}`, `; Domain=${location.hostname}`]) {
      document.cookie = `${name}=; Path=/; Max-Age=0${d}`;
    }
  }
}
