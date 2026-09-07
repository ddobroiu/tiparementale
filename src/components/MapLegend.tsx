"use client";

import { useState } from "react";

import { NodeGlyph } from "./NodeGlyph";
import { NODE_TYPE_LABELS, type MindNode, type NodeType } from "@/lib/types";

const ORDER: NodeType[] = [
  "belief",
  "pattern",
  "emotion",
  "fear",
  "value",
  "goal",
  "relationship",
];

/**
 * Cheia de citire a hărții.
 *
 * Stă pliată, ca un „?" într-un colț: cine a înțeles formele nu are nevoie de
 * ea, iar cine se uită prima dată o găsește exact unde se uită. Arată doar
 * tipurile care există chiar în harta lui — o legendă cu șapte forme, dintre
 * care are patru, e mai mult zgomot decât ajutor.
 */
export function MapLegend({ nodes }: { nodes: MindNode[] }) {
  const [open, setOpen] = useState(false);

  const present = ORDER.filter((type) => nodes.some((n) => n.type === type));
  if (present.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-10 sm:bottom-6 sm:left-6">
      {open ? (
        <div className="animate-fade-up rounded-xl border border-ink-line bg-ink-soft/95 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-6">
            <span className="text-[10px] tracking-[0.16em] text-paper-faint uppercase">
              Cum se citește
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-paper-faint hover:text-paper"
              aria-label="Închide"
            >
              ✕
            </button>
          </div>

          <ul className="mt-2.5 space-y-1.5">
            {present.map((type) => (
              <li key={type} className="flex items-center gap-2.5">
                <svg viewBox="-14 -14 28 28" className="h-4 w-4 shrink-0">
                  <NodeGlyph
                    type={type}
                    r={10}
                    color="#c8b6ff"
                    fillOpacity={0.18}
                    strokeOpacity={0.8}
                    strokeWidth={1.2}
                    dashed={false}
                  />
                </svg>
                <span className="text-xs text-paper-dim">{NODE_TYPE_LABELS[type]}</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 max-w-[13rem] text-[11px] leading-snug text-paper-faint">
            Culoarea spune zona de viață. Conturul punctat înseamnă că nu ai
            confirmat încă, iar mărimea, cât de sigur e tiparul.
          </p>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border border-ink-line bg-ink-soft/80 px-3 py-1.5 text-xs text-paper-faint backdrop-blur-md transition-colors hover:border-paper-faint hover:text-paper-dim"
        >
          Cum se citește harta
        </button>
      )}
    </div>
  );
}
