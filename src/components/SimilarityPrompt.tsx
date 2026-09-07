"use client";

import { useState } from "react";

export interface SimilarPair {
  id: string;
  score: number;
  a_id: string;
  a_label: string;
  b_id: string;
  b_label: string;
}

/**
 * „Astea două par același lucru.”
 *
 * Se arată singură, spre deosebire de predicții: este o întrebare pe care i-o
 * datorăm omului. Am creat două noduri unde poate era unul, iar dacă nu
 * întrebăm, harta lui rămâne cu o dublură pe care el nu are de unde s-o vadă.
 *
 * Decizia rămâne a lui. Două convingeri care par identice unui algoritm pot fi
 * distincte pentru cel care le trăiește, iar unirea greșită ar șterge o
 * distincție reală.
 */
export function SimilarityPrompt({
  pairs: initial,
  onResolved,
}: {
  pairs: SimilarPair[];
  onResolved: () => void;
}) {
  const [pairs, setPairs] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const pair = pairs[0];
  if (!pair || dismissed) return null;

  async function decide(status: "same" | "different") {
    if (!pair) return;
    setBusy(true);
    try {
      await fetch(`/api/similarities/${pair.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setPairs((rest) => rest.slice(1));
      onResolved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-up w-[min(92vw,26rem)] rounded-2xl border border-[color:var(--pattern)]/35 bg-ink-soft/95 p-5 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <span className="text-[10px] tracking-[0.16em] text-paper-faint uppercase">
          Par același lucru
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-paper-faint hover:text-paper"
          aria-label="Mai târziu"
        >
          ✕
        </button>
      </div>

      <p className="mt-4 font-serif text-lg leading-snug text-paper">
        „{pair.a_label}”
      </p>
      <p className="my-2 text-xs text-paper-faint">și</p>
      <p className="font-serif text-lg leading-snug text-paper">„{pair.b_label}”</p>

      <p className="mt-4 text-sm leading-relaxed text-paper-dim">
        Sunt aceeași convingere, spusă altfel?
      </p>

      <div className="mt-4 flex gap-2">
        <button
          disabled={busy}
          onClick={() => decide("same")}
          className="flex-1 rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Da, unește-le
        </button>
        <button
          disabled={busy}
          onClick={() => decide("different")}
          className="flex-1 rounded-xl border border-ink-line px-4 py-2.5 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper disabled:opacity-50"
        >
          Nu, sunt diferite
        </button>
      </div>

      {pairs.length > 1 && (
        <p className="mt-3 text-[11px] text-paper-faint">
          Încă {pairs.length - 1} de verificat
        </p>
      )}
    </div>
  );
}
