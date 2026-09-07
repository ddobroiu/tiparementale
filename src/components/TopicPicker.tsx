"use client";

import { useState } from "react";

import { TOPICS, type Topic } from "@/lib/topics";
import { DOMAIN_COLORS, DOMAIN_LABELS, EXPLORABLE_DOMAINS, type LifeDomain } from "@/lib/types";
import type { MindNode } from "@/lib/types";

/**
 * Ușile de intrare în conversație.
 *
 * „Vorbește liber" e greu de folosit când nu știi de unde să începi — cea mai
 * frecventă reacție la un cursor gol e să închizi pagina. Zonele și subiectele
 * dau un punct de plecare, iar bulina de lângă fiecare zonă arată câte
 * elemente ai deja acolo: se vede singur unde nu ai fost niciodată.
 */
interface Props {
  nodes: MindNode[];
  busy: boolean;
  onFree: () => void;
  onTopic: (topic: Topic, domain: LifeDomain) => void;
}

export function TopicPicker({ nodes, busy, onFree, onTopic }: Props) {
  const [open, setOpen] = useState<LifeDomain | null>(null);

  const counts = new Map<LifeDomain, number>();
  for (const node of nodes) {
    if (node.verdict === "rejected") continue;
    counts.set(node.domain, (counts.get(node.domain) ?? 0) + 1);
  }

  return (
    <div className="pointer-events-auto w-[min(94vw,44rem)] rounded-2xl border border-ink-line bg-ink-soft/95 p-4 backdrop-blur-md sm:p-5">
      {open ? (
        <>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs tracking-[0.16em] text-paper-faint uppercase">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: DOMAIN_COLORS[open] }}
              />
              {DOMAIN_LABELS[open]}
            </span>
            <button
              onClick={() => setOpen(null)}
              className="text-xs text-paper-faint hover:text-paper"
            >
              ← toate zonele
            </button>
          </div>

          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {TOPICS[open].map((topic) => (
              <li key={topic.id}>
                <button
                  disabled={busy}
                  onClick={() => onTopic(topic, open)}
                  className="w-full rounded-xl border border-ink-line p-3 text-left transition-colors hover:border-paper-faint disabled:opacity-50"
                >
                  <span className="text-sm text-paper">{topic.title}</span>
                  <span className="mt-1 block text-xs leading-snug text-paper-faint">
                    {topic.opener}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="text-xs tracking-[0.16em] text-paper-faint uppercase">
            De unde începem
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {EXPLORABLE_DOMAINS.map((domain) => {
              const count = counts.get(domain) ?? 0;
              return (
                <button
                  key={domain}
                  onClick={() => setOpen(domain)}
                  className="group flex items-center gap-2 rounded-full border border-ink-line px-4 py-2 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
                >
                  <span
                    className="h-2 w-2 rounded-full transition-opacity"
                    style={{
                      background: DOMAIN_COLORS[domain],
                      opacity: count > 0 ? 1 : 0.3,
                    }}
                  />
                  {DOMAIN_LABELS[domain]}
                  <span className="text-xs text-paper-faint">{count > 0 ? count : "—"}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onFree}
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Sau vorbește liber, fără subiect
          </button>
        </>
      )}
    </div>
  );
}
