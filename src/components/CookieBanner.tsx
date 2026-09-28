"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  CONSENT_EVENT,
  CONSENT_OPEN_EVENT,
  parseConsentCookie,
  readConsentRaw,
  writeConsent,
} from "@/lib/meta/consent";

/** Cookie-ul e „sursa externă"; se recitește când bannerul răspunde. */
function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}
const getSnapshot = () => readConsentRaw() ?? "";
/** Pe server nu se știe: bannerul nu se randează în HTML-ul inițial. */
const getServerSnapshot = () => "unknown";

/** Ecranele aplicației: acolo omul lucrează, iar bannerul ar acoperi bara de jos. */
const PRIVATE = ["/harta", "/admin", "/setari", "/intra", "/resetare"];

/**
 * Bannerul de cookie-uri, pe categorii: necesare (mereu active), analitice,
 * marketing.
 *
 * Apare până la primul răspuns și se redeschide oricând din „Setări cookies”
 * (subsol). „Refuz” și „Accept toate” au aceeași greutate vizuală: refuzul nu
 * e ascuns într-un link mic, cum cere legea și bunul-simț.
 */
export function CookieBanner() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pathname = usePathname();
  const [reopened, setReopened] = useState(false);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    function onOpen() {
      const current = parseConsentCookie(readConsentRaw());
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setSettings(true);
      setReopened(true);
    }
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  if (raw === "unknown") return null;
  const answered = parseConsentCookie(raw) !== null;
  if (!reopened) {
    if (answered) return null;
    if (PRIVATE.some((p) => pathname.startsWith(p))) return null;
  }

  function answer(value: { analytics: boolean; marketing: boolean }) {
    // Scrierea cookie-ului anunță abonații (scripturile și bannerul).
    writeConsent(value);
    setReopened(false);
    setSettings(false);
  }

  const secondary =
    "rounded-xl border border-ink-line px-4 py-2 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper";
  const primary =
    "rounded-xl bg-paper px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto max-h-[80dvh] max-w-3xl overflow-y-auto rounded-2xl border border-ink-line bg-ink-soft/95 p-4 shadow-2xl backdrop-blur sm:p-5">
        <h2 id="cookie-banner-title" className="text-sm font-medium text-paper">
          Cookie-uri
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-paper-dim">
          Folosim cookie-uri strict necesare ca să funcționeze contul. Cu acordul
          tău, folosim și cookie-uri analitice (Google Analytics, mydashboard.ro)
          și de marketing (Meta), ca să înțelegem de unde vin vizitatorii și dacă
          reclamele noastre ajută. Nimic din ce scrii în aplicație nu ajunge la
          ei.{" "}
          <Link href="/cookies" className="underline underline-offset-4 hover:text-paper">
            Politica de cookies
          </Link>
          .
        </p>

        {settings && (
          <fieldset className="mt-4 space-y-3 border-t border-ink-line pt-4">
            <legend className="sr-only">Categorii de cookie-uri</legend>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked disabled className="mt-1 h-4 w-4 accent-paper" />
              <span>
                <span className="text-paper">Strict necesare</span>
                <span className="block text-paper-faint">
                  Sesiunea de autentificare și alegerea de aici. Mereu active.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1 h-4 w-4 accent-paper"
              />
              <span>
                <span className="text-paper">Analitice</span>
                <span className="block text-paper-faint">
                  Google Analytics 4 și mydashboard.ro: pagini vizitate, surse de
                  trafic, legătura dintre vizită și plată.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1 h-4 w-4 accent-paper"
              />
              <span>
                <span className="text-paper">Marketing</span>
                <span className="block text-paper-faint">
                  Meta Pixel și Conversions API: măsurarea reclamelor de pe
                  Facebook și Instagram.
                </span>
              </span>
            </label>
          </fieldset>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button onClick={() => answer({ analytics: false, marketing: false })} className={primary}>
            Refuz
          </button>
          {settings ? (
            <button onClick={() => answer({ analytics, marketing })} className={secondary}>
              Salvează alegerea
            </button>
          ) : (
            <button onClick={() => setSettings(true)} className={secondary}>
              Setări
            </button>
          )}
          <button onClick={() => answer({ analytics: true, marketing: true })} className={primary}>
            Accept toate
          </button>
        </div>
      </div>
    </div>
  );
}
