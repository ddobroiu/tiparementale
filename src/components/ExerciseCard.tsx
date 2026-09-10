"use client";

import { useState } from "react";

import { EXERCISE_METHOD_LABELS, type ExerciseLog, type Recommendation } from "@/lib/types";

/**
 * Un exercițiu ca procedură: când, ce, ce notezi, când revii — și dedesubt,
 * de câte ori l-ai făcut și cât s-a confirmat frica de fiecare dată.
 *
 * Cifra de la 0 la 10 e progresul măsurat, nu declarat. „Cum te simți" se
 * rescrie de la o zi la alta; „frica s-a confirmat 7, apoi 4, apoi 2" nu.
 */
export function ExerciseCard({
  exercise,
  logs,
  onLogged,
}: {
  exercise: Recommendation;
  logs: ExerciseLog[];
  onLogged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [didIt, setDidIt] = useState(true);
  const [fear, setFear] = useState(5);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const done = logs.filter((l) => l.did_it);
  const fears = done.map((l) => l.fear_confirmed).filter((f): f is number => f !== null);
  const first = fears[0];
  const last = fears[fears.length - 1];
  const trend = first !== undefined && last !== undefined && fears.length > 1 ? last - first : null;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/recommendations/${exercise.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ did_it: didIt, fear_confirmed: didIt ? fear : null, note }),
      });
      if (!res.ok) {
        setError("Nu am putut salva. Încearcă din nou.");
        return;
      }
      setNote("");
      setOpen(false);
      onLogged();
    } catch {
      setError("Nu am putut ajunge la server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-lg border border-ink-line p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-paper">{exercise.title}</p>
        {exercise.method && (
          <span className="shrink-0 rounded-full border border-ink-line px-2 py-0.5 text-[10px] tracking-wide text-paper-faint uppercase">
            {EXERCISE_METHOD_LABELS[exercise.method]}
          </span>
        )}
      </div>

      <dl className="mt-2.5 space-y-1.5 text-xs leading-relaxed">
        <div>
          <dt className="inline text-paper-faint">Când: </dt>
          <dd className="inline text-paper-dim">{exercise.trigger_cue}</dd>
        </div>
        <div>
          <dt className="inline text-paper-faint">Ce faci: </dt>
          <dd className="inline text-paper">{exercise.action}</dd>
        </div>
        <div>
          <dt className="inline text-paper-faint">Notezi: </dt>
          <dd className="inline text-paper-dim">{exercise.record_prompt}</dd>
        </div>
        {exercise.review_after_days && (
          <div>
            <dt className="inline text-paper-faint">Revii: </dt>
            <dd className="inline text-paper-dim">peste {exercise.review_after_days} zile</dd>
          </div>
        )}
      </dl>

      <p className="mt-2 text-[11px] leading-relaxed text-paper-faint">{exercise.rationale}</p>

      {/* Ce s-a întâmplat până acum. Cifrele, în ordine: ăsta e progresul. */}
      {done.length > 0 && (
        <div className="mt-3 border-t border-ink-line pt-2.5 text-xs text-paper-dim">
          Făcut de {done.length} {done.length === 1 ? "dată" : "ori"}
          {fears.length > 0 && (
            <>
              {" "}· frica s-a confirmat:{" "}
              <span className="font-mono text-paper">{fears.join(" → ")}</span>
              {trend !== null && (
                <span
                  className={
                    trend < 0 ? "ml-1 text-[color:var(--value)]" : "ml-1 text-paper-faint"
                  }
                >
                  ({trend < 0 ? "scade" : trend > 0 ? "crește" : "la fel"})
                </span>
              )}
            </>
          )}
        </div>
      )}

      {open ? (
        <div className="mt-3 border-t border-ink-line pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => setDidIt(true)}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs ${
                didIt ? "border-paper-faint text-paper" : "border-ink-line text-paper-faint"
              }`}
            >
              L-am făcut
            </button>
            <button
              onClick={() => setDidIt(false)}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs ${
                !didIt ? "border-paper-faint text-paper" : "border-ink-line text-paper-faint"
              }`}
            >
              Nu l-am făcut
            </button>
          </div>

          {didIt && (
            <label className="mt-3 block text-xs text-paper-dim">
              Cât s-a confirmat frica? <span className="text-paper">{fear}</span> / 10
              <input
                type="range"
                min={0}
                max={10}
                value={fear}
                onChange={(e) => setFear(Number(e.target.value))}
                className="mt-1 w-full accent-[color:var(--belief)]"
              />
              <span className="flex justify-between text-[10px] text-paper-faint">
                <span>deloc</span>
                <span>exact cum mă temeam</span>
              </span>
            </label>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={
              didIt
                ? exercise.record_prompt ?? "Ce s-a întâmplat, concret?"
                : "Ce te-a oprit? Fără judecată — e informație."
            }
            className="mt-3 w-full resize-none rounded-lg border border-ink-line bg-ink px-3 py-2 text-xs text-paper outline-none placeholder:text-paper-faint focus:border-paper-faint"
          />

          <div className="mt-2 flex gap-2">
            <button
              onClick={submit}
              disabled={busy}
              className="flex-1 rounded-lg bg-paper px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-50"
            >
              {busy ? "Salvez…" : "Salvează"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-ink-line px-3 py-1.5 text-xs text-paper-faint"
            >
              Renunță
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-[color:var(--emotion)]">{error}</p>}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 w-full rounded-lg border border-ink-line px-3 py-1.5 text-xs text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
        >
          {done.length > 0 ? "L-am făcut din nou" : "Am făcut-o — notez ce s-a întâmplat"}
        </button>
      )}
    </li>
  );
}
