"use client";

import { useState } from "react";

import { NODE_TYPE_LABELS, type MindNode, type NodeType } from "@/lib/types";

export interface Filters {
  types: Set<NodeType>;
  onlyConfirmed: boolean;
  onlyChanged: boolean;
}

export const NO_FILTERS: Filters = {
  types: new Set(),
  onlyConfirmed: false,
  onlyChanged: false,
};

export function filtersActive(f: Filters): number {
  return f.types.size + (f.onlyConfirmed ? 1 : 0) + (f.onlyChanged ? 1 : 0);
}

/** Un set gol înseamnă „toate", nu „niciuna". */
export function applyFilters(nodes: MindNode[], f: Filters): MindNode[] {
  return nodes.filter((node) => {
    if (f.types.size > 0 && !f.types.has(node.type)) return false;
    if (f.onlyConfirmed && node.verdict !== "confirmed" && node.verdict !== "edited") {
      return false;
    }
    if (f.onlyChanged) {
      const peak = node.peak_confidence ?? node.confidence;
      if (peak - node.confidence < 0.05) return false;
    }
    return true;
  });
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

interface Props {
  nodes: MindNode[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}

/**
 * Filtrele hărții.
 *
 * Arată numai zonele și tipurile care există chiar în harta omului: un filtru
 * pentru o categorie goală nu ajută pe nimeni și îl face să creadă că a pierdut
 * ceva.
 */
export function MapFilters({ nodes, filters, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const types = [...new Set(nodes.map((n) => n.type))];
  const active = filtersActive(filters);

  if (nodes.length === 0) return null;

  return (
    <div className="absolute top-16 right-4 z-10 sm:top-20 sm:right-6">
      {open ? (
        <div className="animate-fade-up w-[min(84vw,17rem)] rounded-xl border border-ink-line bg-ink-soft/95 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] tracking-[0.16em] text-paper-faint uppercase">
              Arată doar
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-paper-faint hover:text-paper"
              aria-label="Închide"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {types.map((type) => {
              const on = filters.types.has(type);
              return (
                <button
                  key={type}
                  onClick={() => onChange({ ...filters, types: toggle(filters.types, type) })}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    on
                      ? "border-paper-faint text-paper"
                      : "border-ink-line text-paper-faint hover:text-paper-dim"
                  }`}
                >
                  {NODE_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 space-y-1.5 border-t border-ink-line pt-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-paper-dim">
              <input
                type="checkbox"
                checked={filters.onlyConfirmed}
                onChange={(e) => onChange({ ...filters, onlyConfirmed: e.target.checked })}
                className="accent-[color:var(--value)]"
              />
              Doar ce am confirmat
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-paper-dim">
              <input
                type="checkbox"
                checked={filters.onlyChanged}
                onChange={(e) => onChange({ ...filters, onlyChanged: e.target.checked })}
                className="accent-[color:var(--value)]"
              />
              Doar ce s-a schimbat
            </label>
          </div>

          {active > 0 && (
            <button
              onClick={() => onChange(NO_FILTERS)}
              className="mt-3 w-full rounded-lg border border-ink-line py-1.5 text-xs text-paper-faint hover:text-paper-dim"
            >
              Arată tot
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-ink-line bg-ink-soft/80 px-3 py-1.5 text-xs text-paper-faint backdrop-blur-md transition-colors hover:border-paper-faint hover:text-paper-dim"
        >
          Filtre
          {active > 0 && (
            <span className="rounded-full bg-paper px-1.5 text-[10px] text-ink">{active}</span>
          )}
        </button>
      )}
    </div>
  );
}
