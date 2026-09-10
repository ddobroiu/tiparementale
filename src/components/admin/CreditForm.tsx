"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const INPUT =
  "w-full rounded-xl border border-ink-line bg-ink-soft px-3 py-2 text-sm text-paper outline-none placeholder:text-paper-faint focus:border-paper-faint";

/**
 * Adaugă sau scade credite. Valorile negative sunt permise — o plată
 * rambursată sau o greșeală se corectează din același loc.
 */
export function CreditForm({ userId, email }: { userId: string; email?: string }) {
  const router = useRouter();
  const [sessions, setSessions] = useState("0");
  const [transformations, setTransformations] = useState("0");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setDone("");

    const res = await fetch("/api/admin/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        sessions: Number(sessions),
        transformations: Number(transformations),
        note,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Ceva n-a mers.");
      setBusy(false);
      return;
    }

    setDone(`Acum: ${data.wallet.sessionsLeft} ședințe, ${data.wallet.transformationsLeft} transformări.`);
    setSessions("0");
    setTransformations("0");
    setNote("");
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-paper-faint/40 p-5">
      <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
        Adaugă credite{email ? <span className="normal-case tracking-normal text-paper-dim"> · {email}</span> : null}
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-xs text-paper-faint">
          Ședințe
          <input
            type="number"
            min={-100}
            max={100}
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
            className={`${INPUT} mt-1`}
          />
        </label>
        <label className="text-xs text-paper-faint">
          Transformări
          <input
            type="number"
            min={-100}
            max={100}
            value={transformations}
            onChange={(e) => setTransformations(e.target.value)}
            className={`${INPUT} mt-1`}
          />
        </label>
      </div>

      <label className="mt-3 block text-xs text-paper-faint">
        De ce
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="cadou, plată manuală, compensație…"
          maxLength={200}
          className={`${INPUT} mt-1`}
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          ["+4 / +2", 4, 2],
          ["+12 / +6", 12, 6],
          ["+1 șed.", 1, 0],
          ["+1 tr.", 0, 1],
        ].map(([label, s, t]) => (
          <button
            key={String(label)}
            type="button"
            onClick={() => {
              setSessions(String(s));
              setTransformations(String(t));
            }}
            className="rounded-full border border-ink-line px-3 py-1 text-xs text-paper-dim hover:border-paper-faint hover:text-paper"
          >
            {label}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={busy || (Number(sessions) === 0 && Number(transformations) === 0)}
        className="mt-4 w-full rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "Un moment…" : "Aplică"}
      </button>

      {error && <p className="mt-3 text-sm text-[color:var(--emotion)]">{error}</p>}
      {done && <p className="mt-3 text-sm text-[color:var(--value)]">{done}</p>}

      <p className="mt-4 text-xs leading-relaxed text-paper-faint">
        Plafonul tehnic de cost crește odată cu creditele, ca la un pachet plătit. Fiecare
        ajustare rămâne în registru, cu numele tău.
      </p>
    </form>
  );
}
