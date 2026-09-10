"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { GA_ID } from "@/lib/ga";
import { CONSENT_EVENT, readConsent, writeConsent } from "@/lib/meta/consent";
import { PIXEL_ID } from "@/lib/meta/pixel";

/** Cookie-ul e „sursa externă"; se recitește când bannerul răspunde. */
function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}
const getSnapshot = () => readConsent();
/** Pe server nu se știe: bannerul nu se randează în HTML-ul inițial. */
const getServerSnapshot = () => "unknown" as const;

/**
 * Bannerul de cookie-uri.
 *
 * Apare o singură dată, doar dacă avem ce cere (pixel configurat) și nu s-a
 * răspuns deja. Cele două butoane au aceeași greutate vizuală: refuzul nu e
 * ascuns într-un link mic, cum cere legea și bunul-simț.
 */
export function CookieBanner() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if ((!PIXEL_ID && !GA_ID) || consent !== null) return null;

  function answer(value: "granted" | "denied") {
    // Scrierea cookie-ului anunță abonații, deci bannerul dispare singur.
    writeConsent(value);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie-uri"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-ink-line bg-ink-soft/95 p-5 shadow-2xl backdrop-blur sm:flex-row sm:items-center">
        <p className="flex-1 text-sm leading-relaxed text-paper-dim">
          Folosim cookie-uri de la Meta și Google ca să înțelegem de unde vin
          vizitatorii și dacă reclamele noastre ajută. Nimic din ce scrii în
          aplicație nu ajunge la ei.{" "}
          <Link
            href="/confidentialitate"
            className="underline underline-offset-4 hover:text-paper"
          >
            Detalii
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => answer("denied")}
            className="rounded-xl border border-ink-line px-4 py-2 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
          >
            Refuz
          </button>
          <button
            onClick={() => answer("granted")}
            className="rounded-xl bg-paper px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
