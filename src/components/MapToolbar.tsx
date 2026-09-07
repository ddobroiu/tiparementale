"use client";

import { DOMAIN_COLORS, DOMAIN_LABELS, type LifeDomain, type MindNode } from "@/lib/types";

/**
 * Controlul direct al hărții: căutare și ramuri, mereu la vedere.
 *
 * Filtrele ascunse într-un meniu se folosesc rar, pentru că nu-ți amintești că
 * există. Ramurile stau afară, cu numărul de elemente lângă fiecare, iar
 * apăsarea uneia stinge restul hărții în loc să-l ascundă: rămâne clar că
 * lucrurile sunt tot acolo, doar că nu despre ele e vorba acum.
 */
interface Props {
  nodes: MindNode[];
  focusDomain: LifeDomain | null;
  onFocus: (domain: LifeDomain | null) => void;
  query: string;
  onQuery: (query: string) => void;
}

export function MapToolbar({ nodes, focusDomain, onFocus, query, onQuery }: Props) {
  if (nodes.length === 0) return null;

  const counts = new Map<LifeDomain, number>();
  for (const node of nodes) {
    counts.set(node.domain, (counts.get(node.domain) ?? 0) + 1);
  }

  const domains = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-14 z-10 px-4 sm:top-16 sm:px-6">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Caută în hartă…"
            className="w-36 rounded-full border border-ink-line bg-ink-soft/80 px-3.5 py-1.5 text-xs text-paper backdrop-blur-md outline-none transition-all placeholder:text-paper-faint focus:w-48 focus:border-paper-faint"
          />
          {query.length > 0 && (
            <button
              onClick={() => onQuery("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-paper-faint hover:text-paper"
              aria-label="Șterge căutarea"
            >
              ✕
            </button>
          )}
        </div>

        {domains.map(([domain, count]) => {
          const on = focusDomain === domain;
          return (
            <button
              key={domain}
              onClick={() => onFocus(on ? null : domain)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs backdrop-blur-md transition-colors ${
                on
                  ? "border-paper-faint bg-ink-soft text-paper"
                  : "border-ink-line bg-ink-soft/80 text-paper-faint hover:text-paper-dim"
              }`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: DOMAIN_COLORS[domain] }}
              />
              {DOMAIN_LABELS[domain]}
              <span className="text-paper-faint">{count}</span>
            </button>
          );
        })}

        {focusDomain && (
          <button
            onClick={() => onFocus(null)}
            className="rounded-full px-2 py-1.5 text-xs text-paper-faint underline underline-offset-2 hover:text-paper-dim"
          >
            toate
          </button>
        )}
      </div>
    </div>
  );
}
