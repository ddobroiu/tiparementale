"use client";

import { useState } from "react";

interface Theme {
  title: string;
  explanation: string;
  node_ids: string[];
}

interface ReadingRow {
  id: string;
  summary: string;
  themes: { themes?: Theme[]; tension?: string; blind_spot?: string } | null;
  node_count: number;
  created_at: string;
}

/**
 * Citirea hărții.
 *
 * Fiecare nod în parte e o observație; valoarea apare când se pun laolaltă.
 * Aceeași regulă care explică amânarea la muncă explică și tăcerea într-o
 * relație — dar asta nu se vede uitându-te la noduri, ci la structura dintre
 * ele.
 *
 * Se deschide la cerere și se generează la cerere. Citirile vechi rămân în
 * bază cu data lor, ca cea de peste două luni să poată fi comparată cu asta.
 */
export function MapReading({ onOpenNode }: { onOpenNode: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState<ReadingRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [stale, setStale] = useState(false);
  const [needed, setNeeded] = useState(0);
  const [canRead, setCanRead] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true);
    try {
      const res = await fetch("/api/reading");
      if (!res.ok) return;
      const data = await res.json();
      setReading(data.reading);
      setStale(Boolean(data.stale));
      setCanRead(data.nodeCount >= data.minNodes);
      setNeeded(Math.max(0, data.minNodes - data.nodeCount));
      setLoaded(true);
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reading", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nu a mers. Încearcă din nou.");
        return;
      }
      setReading(data.reading);
      setStale(false);
    } catch {
      setError("Nu am putut ajunge la server.");
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
        className="rounded-full border border-ink-line bg-ink-soft/80 px-3.5 py-1.5 text-xs text-paper-dim backdrop-blur-md transition-colors hover:border-paper-faint hover:text-paper"
      >
        Citește harta
      </button>
    );
  }

  const content = reading?.themes ?? null;

  return (
    <div className="animate-fade-up fixed inset-x-0 bottom-0 z-40 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-ink-line bg-ink-soft p-5 sm:static sm:z-auto sm:max-h-[70vh] sm:w-[min(92vw,30rem)] sm:rounded-2xl sm:border sm:bg-ink-soft/95 sm:backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <span className="text-[10px] tracking-[0.16em] text-paper-faint uppercase">
          Citirea hărții
        </span>
        <button
          onClick={() => setOpen(false)}
          className="text-paper-faint hover:text-paper"
          aria-label="Închide"
        >
          ✕
        </button>
      </div>

      {busy && !reading && <p className="mt-4 text-sm text-paper-faint">Citesc…</p>}

      {loaded && !reading && !busy && (
        <div className="mt-4">
          {canRead ? (
            <>
              <p className="text-sm leading-relaxed text-paper-dim">
                Pot să mă uit la toată harta odată și să-ți spun ce se repetă
                între zone care par fără legătură.
              </p>
              <button
                onClick={generate}
                className="mt-4 w-full rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
              >
                Citește-mi harta
              </button>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-paper-dim">
              Mai am nevoie de {needed}{" "}
              {needed === 1 ? "element" : "elemente"} ca să pot spune ceva care
              nu e inventat.
            </p>
          )}
        </div>
      )}

      {reading && (
        <>
          <p className="mt-4 text-[15px] leading-relaxed text-paper-dim">
            {reading.summary}
          </p>

          {content?.themes && content.themes.length > 0 && (
            <div className="mt-6 space-y-4">
              {content.themes.map((theme, i) => (
                <div key={i} className="border-l border-ink-line pl-4">
                  <h3 className="font-serif text-lg leading-snug text-paper">
                    {theme.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-paper-dim">
                    {theme.explanation}
                  </p>
                  {theme.node_ids.length > 0 && (
                    <button
                      onClick={() => onOpenNode(theme.node_ids[0])}
                      className="mt-2 text-xs text-paper-faint underline underline-offset-2 hover:text-paper-dim"
                    >
                      Vezi pe hartă
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {content?.tension && (
            <div className="mt-6 rounded-xl border border-[color:var(--pattern)]/30 p-4">
              <p className="text-[10px] tracking-[0.16em] text-paper-faint uppercase">
                Contradicția
              </p>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">
                {content.tension}
              </p>
            </div>
          )}

          {content?.blind_spot && (
            <div className="mt-3 rounded-xl border border-ink-line p-4">
              <p className="text-[10px] tracking-[0.16em] text-paper-faint uppercase">
                Ce nu apare
              </p>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">
                {content.blind_spot}
              </p>
            </div>
          )}

          <p className="mt-5 text-[11px] text-paper-faint">
            Citire din{" "}
            {new Date(reading.created_at).toLocaleDateString("ro-RO", {
              day: "numeric",
              month: "long",
            })}
            , pe {reading.node_count} elemente.
          </p>

          {stale && (
            <button
              onClick={generate}
              disabled={busy}
              className="mt-3 w-full rounded-xl border border-ink-line px-4 py-2.5 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper disabled:opacity-50"
            >
              {busy ? "Citesc…" : "Harta s-a mărit — citește din nou"}
            </button>
          )}
        </>
      )}

      {error && <p className="mt-3 text-xs text-[color:var(--emotion)]">{error}</p>}
    </div>
  );
}
