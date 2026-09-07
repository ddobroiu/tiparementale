"use client";

import Link from "next/link";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function IntraPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });

    if (error) {
      setError(error.message);
      setState("error");
      return;
    }
    setState("sent");
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <Link href="/" className="font-serif text-lg tracking-tight">
          Tipare Mentale
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm">
          {state === "sent" ? (
            <div className="animate-fade-up">
              <h1 className="font-serif text-3xl">Verifică-ți emailul</h1>
              <p className="mt-4 leading-relaxed text-paper-dim">
                Am trimis un link către <span className="text-paper">{email}</span>.
                Deschide-l și harta ta te așteaptă.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-3xl">Intră</h1>
              <p className="mt-3 leading-relaxed text-paper-dim">
                Fără parolă. Primești un link pe email.
              </p>

              <form onSubmit={submit} className="mt-8">
                <label htmlFor="email" className="sr-only">
                  Adresa de email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adresa@exemplu.ro"
                  className="w-full rounded-xl border border-ink-line bg-ink-soft px-4 py-3 text-paper outline-none placeholder:text-paper-faint focus:border-paper-faint"
                />
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="mt-3 w-full rounded-xl bg-paper px-4 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {state === "sending" ? "Se trimite…" : "Trimite linkul"}
                </button>
              </form>

              {state === "error" && (
                <p className="mt-4 text-sm text-[color:var(--emotion)]">{error}</p>
              )}

              <p className="mt-8 text-xs leading-relaxed text-paper-faint">
                Ce scrii aici rămâne al tău. Poți exporta sau șterge tot, oricând.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
