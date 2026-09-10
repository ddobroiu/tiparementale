"use client";

import { useState } from "react";

import { GOAL_LABELS, GOAL_ORDER, GUIDES, type Guide, type GuideGoal } from "@/lib/guides";
import { TOPICS, type Topic } from "@/lib/topics";
import {
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  EXPLORABLE_DOMAINS,
  type LifeDomain,
  type MindNode,
} from "@/lib/types";

/**
 * De unde începem: pe ce vrea omul să lucreze.
 *
 * Prima întrebare nu e „despre ce vorbim", ci „ce vrei să înțelegi" — de unde
 * vin tiparele, cum te vezi, relațiile, banii, copiii. Sub fiecare scop stau
 * ghidurile: teme cu parcurs, gândite după literatura de specialitate, nu
 * după inspirație. Subiectele scurte de dinainte rămân, ca a doua opțiune,
 * pentru cine vrea o singură întrebare și atât.
 */
interface Props {
  nodes: MindNode[];
  busy: boolean;
  onFree: () => void;
  onGuide: (guide: Guide) => void;
  onTopic: (topic: Topic, domain: LifeDomain) => void;
}

type View = { kind: "goals" } | { kind: "goal"; goal: GuideGoal } | { kind: "topics"; domain: LifeDomain | null };

export function GuidePicker({ nodes, busy, onFree, onGuide, onTopic }: Props) {
  const [view, setView] = useState<View>({ kind: "goals" });

  const counts = new Map<LifeDomain, number>();
  for (const node of nodes) {
    if (node.verdict === "rejected") continue;
    counts.set(node.domain, (counts.get(node.domain) ?? 0) + 1);
  }

  return (
    <div className="pointer-events-auto max-h-[75dvh] w-full overflow-y-auto p-4 sm:w-[min(94vw,46rem)] sm:rounded-2xl sm:border sm:border-ink-line sm:bg-ink-soft/95 sm:p-5 sm:backdrop-blur-md">
      {view.kind === "goals" && (
        <>
          <p className="text-xs tracking-[0.16em] text-paper-faint uppercase">
            Pe ce vrei să lucrezi
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {GOAL_ORDER.map((goal) => {
              const count = GUIDES.filter((g) => g.goal === goal).length;
              return (
                <button
                  key={goal}
                  onClick={() => setView({ kind: "goal", goal })}
                  className="rounded-xl border border-ink-line p-3.5 text-left transition-colors hover:border-paper-faint"
                >
                  <span className="text-sm text-paper">{GOAL_LABELS[goal]}</span>
                  <span className="mt-1 block text-xs text-paper-faint">
                    {count} {count === 1 ? "temă" : "teme"}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => setView({ kind: "topics", domain: null })}
              className="rounded-xl border border-ink-line p-3.5 text-left transition-colors hover:border-paper-faint"
            >
              <span className="text-sm text-paper">O singură întrebare</span>
              <span className="mt-1 block text-xs text-paper-faint">
                Subiecte scurte, pe zone
              </span>
            </button>
          </div>

          <button
            onClick={onFree}
            disabled={busy}
            className="mt-4 w-full rounded-xl px-4 py-2 text-sm text-paper-faint transition-colors hover:text-paper-dim disabled:opacity-50"
          >
            Sau vorbește liber, fără temă
          </button>
        </>
      )}

      {view.kind === "goal" && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs tracking-[0.16em] text-paper-faint uppercase">
              {GOAL_LABELS[view.goal]}
            </span>
            <button
              onClick={() => setView({ kind: "goals" })}
              className="text-xs text-paper-faint hover:text-paper"
            >
              ← înapoi
            </button>
          </div>

          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {GUIDES.filter((g) => g.goal === view.goal).map((guide) => (
              <li key={guide.id}>
                <button
                  disabled={busy}
                  onClick={() => onGuide(guide)}
                  className="w-full rounded-xl border border-ink-line p-3.5 text-left transition-colors hover:border-paper-faint disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: DOMAIN_COLORS[guide.domain] }}
                    />
                    <span className="font-serif text-[15px] text-paper">{guide.title}</span>
                  </span>
                  <span className="mt-1.5 block text-xs leading-snug text-paper-dim">
                    {guide.summary}
                  </span>
                  <span className="mt-2 block text-[11px] text-paper-faint">
                    {guide.steps.length} pași · ~{guide.steps.length * 3} min
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {view.kind === "topics" && view.domain === null && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs tracking-[0.16em] text-paper-faint uppercase">
              O singură întrebare
            </span>
            <button
              onClick={() => setView({ kind: "goals" })}
              className="text-xs text-paper-faint hover:text-paper"
            >
              ← înapoi
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {EXPLORABLE_DOMAINS.map((domain) => {
              const count = counts.get(domain) ?? 0;
              return (
                <button
                  key={domain}
                  onClick={() => setView({ kind: "topics", domain })}
                  className="flex items-center gap-2 rounded-full border border-ink-line px-4 py-2 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: DOMAIN_COLORS[domain], opacity: count > 0 ? 1 : 0.3 }}
                  />
                  {DOMAIN_LABELS[domain]}
                  <span className="text-xs text-paper-faint">{count > 0 ? count : "—"}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {view.kind === "topics" && view.domain !== null && (
        <>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs tracking-[0.16em] text-paper-faint uppercase">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: DOMAIN_COLORS[view.domain] }}
              />
              {DOMAIN_LABELS[view.domain]}
            </span>
            <button
              onClick={() => setView({ kind: "topics", domain: null })}
              className="text-xs text-paper-faint hover:text-paper"
            >
              ← toate zonele
            </button>
          </div>

          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {TOPICS[view.domain].map((topic) => (
              <li key={topic.id}>
                <button
                  disabled={busy}
                  onClick={() => onTopic(topic, view.domain!)}
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
      )}
    </div>
  );
}
