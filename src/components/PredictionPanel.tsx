"use client";

import { useState } from "react";

interface Prediction {
  id: string;
  node_id: string;
  node_label: string;
  situation: string;
  behaviour: string;
  rationale: string;
}

/**
 * „Te regăsești?”
 *
 * Momentul în care produsul nu îți mai spune ce crezi, ci ce probabil faci.
 * Se deschide la cerere, nu automat: o predicție nesolicitată despre
 * comportamentul cuiva e intruzivă, aceeași predicție cerută e revelatoare.
 *
 * Datele se încarcă la deschidere, nu la montare — de aceea nu există niciun
 * efect aici, doar acțiuni pornite de om.
 */
export function PredictionPanel({ onAnswered }: { onAnswered: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<Prediction[]>([]);
  const [index, setIndex] = useState(0);
  const [canGenerate, setCanGenerate] = useState(false);
  const [needed, setNeeded] = useState(0);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/predictions");
      if (!res.ok) return;
      const data = await res.json();
      setList(data.predictions ?? []);
      setIndex(0);
      setCanGenerate(data.canGenerate);
      setNeeded(Math.max(0, data.minConfirmed - data.confirmedCount));
      setLoaded(true);
    } catch {
      setError("Nu am putut încărca. Încearcă din nou.");
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/predictions", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Nu a mers. Încearcă din nou.");
        return;
      }
      if ((data.predictions ?? []).length === 0) {
        setError("Nu am găsit nimic destul de sigur ca să merite spus.");
        return;
      }

      setList(data.predictions);
      setIndex(0);
    } catch {
      setError("Nu am putut ajunge la server.");
    } finally {
      setBusy(false);
    }
  }

  async function answer(value: "confirmed" | "rejected") {
    const current = list[index];
    if (!current) return;

    setBusy(true);
    try {
      await fetch(`/api/predictions/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: value }),
      });
      setIndex((i) => i + 1);
      onAnswered();
    } catch {
      setError("Nu am putut salva răspunsul.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          if (!loaded) void load();
        }}
        className="rounded-full border border-[color:var(--belief)]/40 bg-ink-soft/80 px-3.5 py-1.5 text-xs text-paper-dim backdrop-blur-md transition-colors hover:border-[color:var(--belief)] hover:text-paper"
      >
        Te regăsești?
      </button>
    );
  }

  const current = list[index];
  const done = loaded && list.length > 0 && index >= list.length;

  return (
    <div className="animate-fade-up w-[min(92vw,26rem)] rounded-2xl border border-ink-line bg-ink-soft/95 p-5 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <span className="text-[10px] tracking-[0.16em] text-paper-faint uppercase">
          Te regăsești?
        </span>
        <button
          onClick={() => setOpen(false)}
          className="text-paper-faint hover:text-paper"
          aria-label="Închide"
        >
          ✕
        </button>
      </div>

      {busy && list.length === 0 && (
        <p className="mt-4 text-sm text-paper-faint">Un moment…</p>
      )}

      {current && (
        <>
          <p className="mt-4 font-serif text-lg leading-snug text-paper">
            {current.situation}
          </p>
          <p className="mt-2 font-serif text-lg leading-snug text-[color:var(--belief)]">
            {current.behaviour}
          </p>

          <div className="mt-5 flex gap-2">
            <button
              disabled={busy}
              onClick={() => answer("confirmed")}
              className="flex-1 rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Da, exact
            </button>
            <button
              disabled={busy}
              onClick={() => answer("rejected")}
              className="flex-1 rounded-xl border border-ink-line px-4 py-2.5 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper disabled:opacity-50"
            >
              Nu, nu sunt eu
            </button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-paper-faint">
            Din: „{current.node_label}”. {current.rationale}
          </p>

          <p className="mt-3 text-[11px] text-paper-faint">
            {index + 1} din {list.length}
          </p>
        </>
      )}

      {done && (
        <div className="mt-4">
          <p className="text-sm leading-relaxed text-paper-dim">
            Gata. Ce ai confirmat a întărit convingerile din care venea, ce ai
            respins le-a slăbit — harta e mai aproape de tine decât acum cinci
            minute.
          </p>
          <button
            onClick={generate}
            disabled={busy}
            className="mt-4 w-full rounded-xl border border-ink-line px-4 py-2.5 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper disabled:opacity-50"
          >
            {busy ? "Un moment…" : "Mai încearcă"}
          </button>
        </div>
      )}

      {loaded && list.length === 0 && !busy && (
        <div className="mt-4">
          {canGenerate ? (
            <>
              <p className="text-sm leading-relaxed text-paper-dim">
                Pot să încerc să ghicesc cum reacționezi în situații concrete,
                pornind de la ce ai confirmat. Spune-mi dacă nimeresc.
              </p>
              <button
                onClick={generate}
                disabled={busy}
                className="mt-4 w-full rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Mă gândesc…" : "Încearcă să mă nimerești"}
              </button>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-paper-dim">
              Confirmă întâi {needed} {needed === 1 ? "element" : "elemente"} pe
              hartă. Fără ele, orice predicție ar fi ghicit.
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-xs text-[color:var(--emotion)]">{error}</p>}
    </div>
  );
}
