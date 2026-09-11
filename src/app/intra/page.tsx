"use client";

import Link from "next/link";

import { Logo } from "@/components/Logo";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { newEventId, track } from "@/lib/meta/pixel";

/**
 * Ținta de după autentificare vine din adresă, deci din mâna oricui. Acceptăm
 * doar o cale din acest site: „/ceva”, niciodată „//alt-site” sau o adresă
 * completă. Altfel formularul de intrare ar deveni o trambulină spre afară.
 */
function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/")) return "/harta";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/harta";
  return value;
}

function AuthForm() {
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    // ID-ul evenimentului se generează înainte: serverul îl trimite la Meta
    // odată cu crearea contului, browserul abia după răspuns. Același ID —
    // un singur cont nou numărat.
    const eventId = mode === "register" ? newEventId() : undefined;

    let res: Response;
    try {
      res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, email, password, eventId }),
      });
    } catch {
      setError("Nu am putut ajunge la server. Verifică internetul și încearcă din nou.");
      setBusy(false);
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ceva n-a mers. Încearcă din nou.");
      setBusy(false);
      return;
    }

    if (eventId) track("CompleteRegistration", { status: true }, eventId);

    // Navigare completă, nu `router.push`: cookie-ul de sesiune tocmai s-a
    // pus, iar poarta din `proxy.ts` și pagina hărții trebuie să-l vadă pe o
    // cerere nouă. Cu o navigare din client, omul rămânea pe formular.
    window.location.assign(redirect);
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

      <div className="mt-8 rounded-xl border border-ink-line bg-ink-soft p-4 text-center">
        <p className="text-sm text-paper-dim">
          {isRegister ? "Ai deja un cont?" : "Prima dată aici?"}
        </p>
        <button
          type="button"
          onClick={() => {
            setMode(isRegister ? "login" : "register");
            setError("");
          }}
          className="mt-3 w-full rounded-xl border border-paper-faint px-4 py-3 text-sm font-medium text-paper transition-colors hover:border-paper hover:bg-ink-line"
        >
          {isRegister ? "Intră în cont" : "Creează un cont"}
        </button>
      </div>

      {!isRegister && (
        <p className="mt-5 text-center text-sm text-paper-faint">
          <Link href="/resetare" className="underline underline-offset-4 hover:text-paper-dim">
            Ai uitat parola?
          </Link>
        </p>
      )}

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
        <Link href="/">
          <Logo />
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
