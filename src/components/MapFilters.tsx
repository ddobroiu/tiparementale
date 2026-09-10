"use client";

import { useState } from "react";

import {
  SCHEMA_DOMAIN_COLORS,
  SCHEMA_DOMAIN_LABELS,
  schemaOf,
  type SchemaDomain,
} from "@/lib/schemas";
import { NODE_TYPE_LABELS, type MindNode, type NodeType } from "@/lib/types";

export interface Filters {
  types: Set<NodeType>;
  /** Familii de tipare (domeniile schemelor Young). */
  families: Set<SchemaDomain>;
  onlyConfirmed: boolean;
  onlyChanged: boolean;
}

export const NO_FILTERS: Filters = {
  types: new Set(),
  families: new Set(),
  onlyConfirmed: false,
  onlyChanged: false,
};

export function filtersActive(f: Filters): number {
  return (
    f.types.size + f.families.size + (f.onlyConfirmed ? 1 : 0) + (f.onlyChanged ? 1 : 0)
  );
}

/** Un set gol înseamnă „toate", nu „niciuna". */
export function applyFilters(nodes: MindNode[], f: Filters): MindNode[] {
  return nodes.filter((node) => {
    if (f.types.size > 0 && !f.types.has(node.type)) return false;
    if (f.families.size > 0) {
      const schema = schemaOf(node.schema_code);
      if (!schema || !f.families.has(schema.domain)) return false;
    }
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

const FAMILY_ORDER: SchemaDomain[] = [
  "disconnection",
  "autonomy",
  "limits",
  "other_directed",
  "overvigilance",
];

/**
 * Filtrele fine ale hărții.
 *
 * Ramurile de viață stau afară, în bara de sus. Aici rămân tipul, familia de
 * tipare — clasarea după terapia schemelor — și starea. Familia e filtrul care
 * leagă zone diferite: „arată-mi tot ce ține de deconectare" scoate la iveală
 * că frica din relații și amânarea de la muncă au aceeași rădăcină.
 *
 * Se arată numai categoriile care există chiar în harta omului: un filtru
 * pentru o categorie goală nu ajută pe nimeni.
 */
export function MapFilters({ nodes, filters, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const types = [...new Set(nodes.map((n) => n.type))];
  const families = FAMILY_ORDER.filter((family) =>
    nodes.some((n) => schemaOf(n.schema_code)?.domain === family),
  );
  const active = filtersActive(filters);

  if (nodes.length === 0) return null;

  return (
    <div className="absolute top-28 right-4 z-10 sm:top-32 sm:right-6">
      {open ? (
        <div className="animate-fade-up w-[min(84vw,18rem)] rounded-xl border border-ink-line bg-ink-soft/95 p-3 backdrop-blur-md">
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

          {families.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-paper-faint">Familia tiparului</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {families.map((family) => {
                  const on = filters.families.has(family);
                  return (
                    <button
                      key={family}
                      onClick={() =>
                        onChange({ ...filters, families: toggle(filters.families, family) })
                      }
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        on
                          ? "border-paper-faint text-paper"
                          : "border-ink-line text-paper-faint hover:text-paper-dim"
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: SCHEMA_DOMAIN_COLORS[family] }}
                      />
                      {SCHEMA_DOMAIN_LABELS[family]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-3 border-t border-ink-line pt-2.5">
            <p className="text-[10px] text-paper-faint">Tipul</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
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
