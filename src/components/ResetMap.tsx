"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const WORD = "resetez";

/**
 * Golește harta și o lasă ca în prima zi. Contul, ședințele rămase și plățile
 * nu se ating. Cere cuvântul de confirmare, ca la orice ștergere definitivă.
 */
export function ResetMap() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function reset() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Nu a mers. Încearcă din nou.");
        return;
      }
      setDone(
        `Harta e goală: ${data.nodes} ${data.nodes === 1 ? "element" : "elemente"} și ${data.conversations} ${data.conversations === 1 ? "conversație" : "conversații"} șterse.`,
      );
      setOpen(false);
      setTyped("");
      router.refresh();
    } catch {
      setError("Nu am putut ajunge la server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-ink-line p-6">
      <h2 className="font-serif text-xl">Resetează harta</h2>
      <p className="mt-2 text-sm leading-relaxed text-paper-dim">
        Șterge toate elementele, conversațiile și citirile și pornești de la zero. Contul,
        ședințele rămase și plățile nu se ating. Nu se poate anula.
      </p>

      {done && <p className="mt-3 text-sm text-[color:var(--value)]">{done}</p>}

      {open ? (
        <div className="mt-4">
          <label className="block text-xs text-paper-faint">
            Scrie <span className="text-paper">{WORD}</span> ca să confirmi
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-paper-faint"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button
              onClick={reset}
              disabled={busy || typed.trim().toLowerCase() !== WORD}
              className="rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "Resetez…" : "Resetează harta"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setTyped("");
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
          onClick={() => {
            setOpen(true);
            setDone("");
          }}
          className="mt-4 rounded-xl border border-ink-line px-4 py-2.5 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
        >
          Vreau să pornesc de la zero
        </button>
      )}
    </section>
  );
}
