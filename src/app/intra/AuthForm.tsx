"use client";

import Link from "next/link";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { GoogleButton } from "@/components/GoogleButton";
import { SIGNUP_MARKETING_NOTICE, SIGNUP_OPT_OUT_LABEL } from "@/lib/lifecycle/consent";
import { newEventId, track } from "@/lib/meta/pixel";
import { safeRedirect } from "@/lib/redirect";

/** Erorile cu care se întoarce fluxul Google (`/intra?eroare=…`). */
const SERVER_ERRORS: Record<string, string> = {
  google: "Intrarea cu Google nu a reușit. Încearcă din nou sau folosește e-mailul și parola.",
  google_neconfirmat:
    "Adresa contului Google nu este confirmată la Google. Folosește e-mailul și parola.",
  google_fara_cont:
    "Nu există încă un cont cu această adresă. Bifează acordurile de mai jos, apoi apasă din nou „Continuă cu Google”.",
};

export function AuthForm({ googleEnabled }: { googleEnabled: boolean }) {
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));

  // `?cont=nou` (din e-mailuri și din formularul pentru vizitatori) deschide direct înscrierea.
  const [mode, setMode] = useState<"login" | "register">(
    params.get("cont") === "nou" ? "register" : "login",
  );
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [sensitiveConsent, setSensitiveConsent] = useState(false);
  const [marketingOptOut, setMarketingOptOut] = useState(false);
  const eroare = params.get("eroare");
  const [error, setError] = useState(
    eroare ? (SERVER_ERRORS[eroare] ?? "Ceva n-a mers. Încearcă din nou.") : "",
  );
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
        body: JSON.stringify({
          action: mode,
          email,
          password,
          eventId,
          ...(mode === "register" && { acceptTerms, sensitiveConsent, firstName, marketingOptOut }),
        }),
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
  const consentsGiven = acceptTerms && sensitiveConsent;

  /**
   * Pe „Cont nou”, acordurile de mai sus sunt condiții și pentru contul creat
   * cu Google: pleacă spre server odată cu alegerea privind e-mailurile. Pe
   * „Intră” nu pleacă nimic, deci Google nu poate crea un cont de acolo.
   */
  function continueWithGoogle() {
    if (isRegister && !consentsGiven) {
      setError("Ca să creezi contul cu Google, bifează mai întâi ambele acorduri de mai sus.");
      return;
    }
    const query = new URLSearchParams({ redirect });
    if (isRegister) {
      query.set("acord", "1");
      query.set("email", marketingOptOut ? "out" : "in");
    }
    // Ruta de API redirecționează spre Google: trebuie navigare completă, nu `router.push`.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/api/auth/google?${query.toString()}`);
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-serif text-3xl">{isRegister ? "Începe harta ta" : "Intră"}</h1>
      <p className="mt-3 leading-relaxed text-paper-dim">
        {isRegister
          ? "Un cont, și harta pornește goală. O construiești vorbind."
          : "Bine ai revenit. Harta te așteaptă unde ai lăsat-o."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3" data-clarity-mask="true">
        {isRegister && (
          <div>
            <label htmlFor="firstName" className="sr-only">
              Prenumele
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              maxLength={60}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prenumele tău (opțional)"
              className="w-full rounded-xl border border-ink-line bg-ink-soft px-4 py-3 text-paper outline-none placeholder:text-paper-faint focus:border-paper-faint"
            />
          </div>
        )}

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

        {isRegister && (
          <div className="space-y-3 pt-1 text-xs leading-relaxed text-paper-dim">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-paper"
              />
              <span>
                Am cel puțin 18 ani și sunt de acord cu{" "}
                <Link href="/termeni" target="_blank" className="text-paper underline underline-offset-4">
                  Termenii și condițiile
                </Link>
                . Am citit{" "}
                <Link
                  href="/confidentialitate"
                  target="_blank"
                  className="text-paper underline underline-offset-4"
                >
                  Politica de confidențialitate
                </Link>
                .
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                required
                checked={sensitiveConsent}
                onChange={(e) => setSensitiveConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-paper"
              />
              <span>
                Îmi dau consimțământul explicit ca datele pe care le scriu despre
                gândurile, emoțiile și experiențele mele — inclusiv cele care pot
                privi sănătatea mea — să fie prelucrate, inclusiv cu ajutorul
                inteligenței artificiale, doar pentru furnizarea serviciului (art.
                9 alin. 2 lit. a GDPR). Îl pot retrage oricând, prin ștergerea
                contului. Înțeleg că serviciul nu este psihoterapie și nici
                consultanță medicală.
              </span>
            </label>
            <p className="pt-1">{SIGNUP_MARKETING_NOTICE}</p>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={marketingOptOut}
                onChange={(e) => setMarketingOptOut(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-paper"
              />
              <span>{SIGNUP_OPT_OUT_LABEL}</span>
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-paper px-4 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Un moment…" : isRegister ? "Creează contul" : "Intră"}
        </button>
      </form>

      {googleEnabled && (
        <GoogleButton onClick={continueWithGoogle} dimmed={isRegister && !consentsGiven} />
      )}

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
