"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LEAD_CONSENT_TEXT } from "@/lib/lifecycle/consent";
import { parseConsentCookie, readConsentRaw } from "@/lib/meta/consent";

/**
 * Oferta pentru vizitatorii fără cont: lecția introductivă (care există și e
 * gratuită) pe e-mail — prima întrebare, s-o poarte cu ei, și linkul de unde
 * o fac întreagă.
 *
 * Apare o singură dată pe browser: după 30 de secunde pe pagină sau când
 * mouse-ul pleacă spre bara de adrese. Nu pe ecranele aplicației, nu pe
 * pachete (acolo omul cumpără) și nu peste bannerul de cookie-uri. Închiderea
 * se ține minte; dacă browserul nu lasă să se scrie nimic, cel mult o mai
 * vede o dată, la următoarea vizită.
 */

const STORAGE_KEY = "tm_lead_offer";
const DELAY_MS = 30_000;
const EXCLUDED = ["/harta", "/setari", "/admin", "/intra", "/resetare", "/dezabonare", "/pachete"];

function remembered(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function remember(value: "closed" | "sent") {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Stocare blocată: nimic de făcut.
  }
}

const INPUT =
  "w-full rounded-xl border border-ink-line bg-ink px-3 py-2.5 text-sm text-paper outline-none placeholder:text-paper-faint focus:border-paper-faint";

export function LeadCapture() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const excluded = EXCLUDED.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (excluded || remembered()) return;

    let shown = false;
    const startedAt = Date.now();

    function show() {
      if (shown || remembered()) return;
      // Bannerul de cookie-uri are întâietate: nu le punem pe amândouă odată.
      if (parseConsentCookie(readConsentRaw()) === null) return;
      shown = true;
      setOpen(true);
    }

    const timer = window.setTimeout(show, DELAY_MS);
    function onLeave(event: MouseEvent) {
      if (event.clientY <= 0 && !event.relatedTarget && Date.now() - startedAt > 5_000) show();
    }
    document.addEventListener("mouseout", onLeave);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [excluded]);

  if (!open || excluded) return null;

  function close() {
    remember(sent ? "sent" : "closed");
    setOpen(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!consent) {
      setError("Bifează acordul ca să-ți putem trimite lecția.");
      return;
    }
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, consent, website, source: pathname }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Ceva n-a mers. Încearcă din nou.");
        setBusy(false);
        return;
      }
    } catch {
      setError("Nu am putut ajunge la server. Încearcă din nou.");
      setBusy(false);
      return;
    }

    remember("sent");
    setSent(true);
    setBusy(false);
  }

  return (
    <div
      role="dialog"
      aria-labelledby="lead-title"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-2xl border border-ink-line bg-ink-soft p-5 shadow-2xl sm:right-6 sm:left-auto sm:mx-0"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Închide"
        className="absolute top-3 right-3 rounded-full px-2 text-lg leading-none text-paper-faint hover:text-paper"
      >
        ×
      </button>

      {sent ? (
        <>
          <p id="lead-title" className="font-serif text-xl text-paper">
            Verifică e-mailul.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-paper-dim">
            Prima întrebare a lecției e pe drum. Dacă nu apare în câteva minute, uită-te și în
            dosarul de mesaje nedorite.
          </p>
        </>
      ) : (
        <form onSubmit={submit} data-clarity-mask="true">
          <p id="lead-title" className="pr-6 font-serif text-xl text-paper">
            Lecția introductivă, gratuit
          </p>
          <p className="mt-2 text-sm leading-relaxed text-paper-dim">
            Îți trimitem pe e-mail prima întrebare din „Regula pe care o porți” — lecția de
            zece minute cu care începe harta — și linkul de unde o faci întreagă.
          </p>

          <div className="mt-4 space-y-2">
            <input
              type="text"
              autoComplete="given-name"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prenumele (opțional)"
              aria-label="Prenumele"
              className={INPUT}
            />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adresa@exemplu.ro"
              aria-label="Adresa de email"
              className={INPUT}
            />
            {/* Capcană pentru roboți; ascunsă oamenilor și cititoarelor de ecran. */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
              name="website"
            />
          </div>

          <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-paper-dim">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-paper"
            />
            <span>
              {LEAD_CONSENT_TEXT} Detalii în{" "}
              <Link href="/confidentialitate" target="_blank" className="text-paper underline underline-offset-4">
                Politica de confidențialitate
              </Link>
              .
            </span>
          </label>

          {error && <p className="mt-2 text-xs text-[color:var(--emotion)]">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Un moment…" : "Trimite-mi lecția"}
          </button>
        </form>
      )}
    </div>
  );
}
