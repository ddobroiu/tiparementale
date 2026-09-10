"use client";

import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/Logo";

const INPUT =
  "w-full rounded-xl border border-ink-line bg-ink-soft px-4 py-3 text-paper outline-none placeholder:text-paper-faint focus:border-paper-faint";

export default function ResetarePage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-request", email }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ceva n-a mers. Încearcă din nou.");
      setBusy(false);
      return;
    }

    setSent(true);
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm">
          {sent ? (
            <>
              <h1 className="font-serif text-3xl">Verifică e-mailul.</h1>
              <p className="mt-3 leading-relaxed text-paper-dim">
                Dacă există un cont pentru <span className="text-paper">{email}</span>, ai
                primit un link. E valabil o oră.
              </p>
              <p className="mt-6 text-sm leading-relaxed text-paper-faint">
                Nu vine? Uită-te și în dosarul de mesaje nedorite, sau{" "}
                <button
                  onClick={() => setSent(false)}
                  className="underline underline-offset-4 transition-colors hover:text-paper-dim"
                >
                  cere alt link
                </button>
                .
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-3xl">Ai uitat parola.</h1>
              <p className="mt-3 leading-relaxed text-paper-dim">
                Se întâmplă. Scrie adresa cu care ai contul și îți trimitem un link pentru
                o parolă nouă.
              </p>

              <form onSubmit={submit} className="mt-8 space-y-3">
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
                  className={INPUT}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-paper px-4 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Un moment…" : "Trimite linkul"}
                </button>
              </form>

              {error && <p className="mt-4 text-sm text-[color:var(--emotion)]">{error}</p>}
            </>
          )}

          <Link
            href="/intra"
            className="mt-6 inline-block text-sm text-paper-faint underline underline-offset-4 transition-colors hover:text-paper-dim"
          >
            Înapoi la intrare
          </Link>
        </div>
      </div>
    </main>
  );
}
