"use client";

import Link from "next/link";
import { createContext, useContext, useState } from "react";

const Ctx = createContext<{ accepted: boolean; showError: () => void }>({
  accepted: false,
  showError: () => {},
});

export function useCheckoutConsent() {
  return useContext(Ctx);
}

/**
 * Acordul cerut înainte de plată, o singură bifă pentru toate pachetele:
 * termenii, cererea de furnizare imediată și luarea la cunoștință a pierderii
 * dreptului de retragere (OUG 34/2014, art. 16 lit. a și m). Nebifat implicit;
 * serverul refuză plata fără el.
 */
export function CheckoutConsent({
  children,
  show,
}: {
  children: React.ReactNode;
  /** Doar pentru cine e autentificat; ceilalți trec întâi prin crearea contului. */
  show: boolean;
}) {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState(false);

  return (
    <Ctx.Provider value={{ accepted, showError: () => setError(true) }}>
      {show && (
        <div
          className={`mt-8 rounded-2xl border p-4 ${error && !accepted ? "border-[color:var(--emotion)]" : "border-ink-line"}`}
        >
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-paper-dim">
            <input
              type="checkbox"
              required
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked);
                setError(false);
              }}
              className="mt-1 h-4 w-4 shrink-0 accent-paper"
            />
            <span>
              Sunt de acord cu{" "}
              <Link href="/termeni" className="text-paper underline underline-offset-4">
                Termenii și condițiile
              </Link>{" "}
              și solicit furnizarea imediată a serviciului digital. Iau la
              cunoștință că, odată cu începerea executării, îmi pierd dreptul de
              retragere de 14 zile (OUG 34/2014, art. 16 lit. a și m).
            </span>
          </label>
          {error && !accepted && (
            <p className="mt-2 text-xs text-[color:var(--emotion)]">
              Bifează acordul ca să poți continua spre plată.
            </p>
          )}
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}
