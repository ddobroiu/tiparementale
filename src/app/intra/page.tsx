"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/harta";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: mode, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ceva n-a mers. Încearcă din nou.");
      setBusy(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  const isRegister = mode === "register";

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-serif text-3xl">{isRegister ? "Începe harta ta" : "Intră"}</h1>
      <p className="mt-3 leading-relaxed text-paper-dim">
        {isRegister
          ? "Un cont, și harta pornește goală. O construiești vorbind."
          : "Bine ai revenit. Harta te așteaptă unde ai lăsat-o."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <div>
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
        </div>

        <div>
          <label htmlFor="password" className="sr-only">
            Parola
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={isRegister ? 10 : undefined}
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegister ? "Parolă, minimum 10 caractere" : "Parola"}
            className="w-full rounded-xl border border-ink-line bg-ink-soft px-4 py-3 text-paper outline-none placeholder:text-paper-faint focus:border-paper-faint"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-paper px-4 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Un moment…" : isRegister ? "Creează contul" : "Intră"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-[color:var(--emotion)]">{error}</p>}

      <button
        onClick={() => {
          setMode(isRegister ? "login" : "register");
          setError("");
        }}
        className="mt-6 text-sm text-paper-faint underline underline-offset-4 transition-colors hover:text-paper-dim"
      >
        {isRegister ? "Am deja cont" : "Nu am cont încă"}
      </button>

      <p className="mt-8 text-xs leading-relaxed text-paper-faint">
        Ce scrii aici rămâne al tău. Poți exporta sau șterge tot, oricând.
      </p>
    </div>
  );
}

export default function IntraPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <Link href="/" className="font-serif text-lg tracking-tight">
          Tipare Mentale
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-24">
        <Suspense fallback={null}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
