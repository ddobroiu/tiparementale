"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const INPUT =
  "w-full rounded-xl border border-ink-line bg-ink-soft px-4 py-3 text-paper outline-none placeholder:text-paper-faint focus:border-paper-faint";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Cele două parole nu sunt la fel.");
      return;
    }

    setBusy(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", token, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ceva n-a mers. Încearcă din nou.");
      setBusy(false);
      return;
    }

    // Sesiunea e deja deschisă de server: omul ajunge direct pe hartă.
    router.push("/harta");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-serif text-3xl">Parola nouă.</h1>
      <p className="mt-3 leading-relaxed text-paper-dim">
        Minimum 10 caractere. După ce o salvezi, ești conectat direct, iar sesiunile vechi se
        închid.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <div>
          <label htmlFor="password" className="sr-only">
            Parola nouă
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parola nouă"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="confirm" className="sr-only">
            Repetă parola
          </label>
          <input
            id="confirm"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Încă o dată"
            className={INPUT}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-paper px-4 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Un moment…" : "Salvează parola"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-[color:var(--emotion)]">
          {error}{" "}
          {error.includes("expirat") && (
            <Link href="/resetare" className="underline underline-offset-4">
              Cere alt link
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
