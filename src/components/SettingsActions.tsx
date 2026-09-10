"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Cele trei lucruri pe care omul trebuie să le poată face singur cu contul
 * lui: să ia tot ce e al lui, să plece, și să șteargă tot. Fără e-mail către
 * noi, fără așteptare — o promisiune din politica de confidențialitate devine
 * trei butoane.
 */
export function SettingsActions({ email }: { email: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Nu a mers. Încearcă din nou.");
        return;
      }
      router.push("/?cont=sters");
      router.refresh();
    } catch {
      setError("Nu am putut ajunge la server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-ink-line p-6">
        <h2 className="font-serif text-xl">Datele tale</h2>
        <p className="mt-2 text-sm leading-relaxed text-paper-dim">
          Tot ce ai scris și tot ce s-a construit din asta — conversații, hartă,
          citate, exerciții — într-un singur fișier, în forma brută. Al tău.
        </p>
        <a
          href="/api/account/export"
          className="mt-4 inline-block rounded-xl border border-ink-line px-4 py-2.5 text-sm text-paper transition-colors hover:border-paper-faint"
        >
          Descarcă tot (JSON)
        </a>
      </section>

      <section className="rounded-2xl border border-ink-line p-6">
        <h2 className="font-serif text-xl">Ieși din cont</h2>
        <p className="mt-2 text-sm leading-relaxed text-paper-dim">
          Harta rămâne unde e. Intri din nou oricând, cu emailul și parola.
        </p>
        <button
          onClick={logout}
          disabled={busy}
          className="mt-4 rounded-xl border border-ink-line px-4 py-2.5 text-sm text-paper transition-colors hover:border-paper-faint disabled:opacity-50"
        >
          Ieși
        </button>
      </section>

      <section className="rounded-2xl border border-[color:var(--emotion)]/30 p-6">
        <h2 className="font-serif text-xl">Șterge contul</h2>
        <p className="mt-2 text-sm leading-relaxed text-paper-dim">
          Definitiv. Conversațiile, harta, citatele, istoricul — totul dispare
          și nu păstrăm copii. Ședințele necumpărate încă nu se rambursează
          automat; scrie-ne înainte dacă ai pachete neconsumate.
        </p>

        {deleting ? (
          <div className="mt-4">
            <label className="block text-xs text-paper-faint">
              Scrie adresa contului, <span className="text-paper">{email}</span>, ca să confirmi
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
                className="mt-1 w-full rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-paper-faint"
              />
            </label>
            <div className="mt-3 flex gap-2">
              <button
                onClick={deleteAccount}
                disabled={busy || confirm.trim().toLowerCase() !== email.toLowerCase()}
                className="rounded-xl bg-[color:var(--emotion)] px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "Șterg…" : "Șterge definitiv"}
              </button>
              <button
                onClick={() => {
                  setDeleting(false);
                  setConfirm("");
                  setError("");
                }}
                className="rounded-xl border border-ink-line px-4 py-2.5 text-sm text-paper-dim"
              >
                Renunță
              </button>
            </div>
            {error && <p className="mt-3 text-xs text-[color:var(--emotion)]">{error}</p>}
          </div>
        ) : (
          <button
            onClick={() => setDeleting(true)}
            className="mt-4 rounded-xl border border-[color:var(--emotion)]/40 px-4 py-2.5 text-sm text-paper-dim transition-colors hover:border-[color:var(--emotion)] hover:text-paper"
          >
            Vreau să șterg contul
          </button>
        )}
      </section>
    </div>
  );
}
