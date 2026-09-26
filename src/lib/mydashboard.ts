/**
 * Trackerul mydashboard.ro (vizite, surse de trafic, legătura cu plățile),
 * încărcat doar cu acord pentru cookie-uri analitice.
 *
 * Scriptul ține un ID de vizitator în cookie-ul `_md_vid` și în localStorage
 * (`_md_vid`, `_md_sid`, `_md_last`). Îl încărcăm cu `data-consent="required"`
 * și `window.mdConsent = true` (varianta care așteaptă acordul), iar la
 * retragerea acordului ștergem noi înșine cheile, ca să meargă cu orice
 * versiune a scriptului.
 */

const SRC = "https://mydashboard.ro/t.js";
const SITE_ID = "2c35558974bf50ff";
const KEYS = ["_md_vid", "_md_sid", "_md_last"];

type MdTrack = ((name: string, o?: Record<string, unknown>) => void) & {
  consent?: (ok: boolean) => void;
};

declare global {
  interface Window {
    mdTrack?: MdTrack;
    mdConsent?: boolean;
  }
}

export function loadMydashboard() {
  if (typeof document === "undefined") return;
  window.mdConsent = true;
  if (window.mdTrack) {
    window.mdTrack.consent?.(true);
    return;
  }
  if (document.querySelector(`script[src="${SRC}"]`)) return;
  const script = document.createElement("script");
  script.defer = true;
  script.src = SRC;
  script.setAttribute("data-site", SITE_ID);
  script.setAttribute("data-consent", "required");
  document.head.appendChild(script);
}

export function revokeMydashboard() {
  if (typeof document === "undefined") return;
  window.mdConsent = false;
  window.mdTrack?.consent?.(false);
  for (const key of KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `_md_vid=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
