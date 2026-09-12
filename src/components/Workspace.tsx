"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Guide } from "@/lib/guides";
import type { Topic } from "@/lib/topics";
import {
  DOMAIN_COLORS,
  NODE_TYPE_LABELS,
  displayLabel,
  isWorkable,
  type LifeDomain,
  type MindNode,
} from "@/lib/types";
import { AddNodeForm } from "./AddNodeForm";
import { LessonCatalog } from "./LessonCatalog";
import { MapFilters, type Filters } from "./MapFilters";
import { MapReading } from "./MapReading";
import { PredictionPanel } from "./PredictionPanel";
import { SimilarityPrompt, type SimilarPair } from "./SimilarityPrompt";
import type { AccountSummary } from "./MapView";

export type WorkspaceTab = "identify" | "interpret" | "transform";

export const TABS: Array<{
  id: WorkspaceTab;
  step: number;
  label: string;
  lead: string;
  /** Culoarea pasului. Verdele nu apare aici: el înseamnă „gata”. */
  color: string;
}> = [
  {
    id: "identify",
    step: 1,
    label: "Identificare",
    lead: "Din ce povestești în ședințe apar convingerile, valorile și fricile tale.",
    color: "#7cc4fb",
  },
  {
    id: "interpret",
    step: 2,
    label: "Interpretare",
    lead: "Harta se citește. Confirmi ce e adevărat, respingi ce nu e, și ceri o citire de ansamblu.",
    color: "#f6d186",
  },
  {
    id: "transform",
    step: 3,
    label: "Transformare",
    lead: "Pe fiecare convingere confirmată se lucrează: o convingere nouă, exerciții, bifezi ce ai făcut. Când o simți ca a ta, o marchezi rezolvată și devine verde pe hartă.",
    color: "#c8b6ff",
  },
];

/** Starea unui pas în bara de navigare: închis, în lucru sau reușit. */
export interface StepState {
  locked: boolean;
  done: boolean;
  /** De ce e închis — se arată omului când îl atinge. */
  reason: string | null;
}

/**
 * Pașii se deschid unul din altul, ca lecțiile.
 *
 * Nu e o regulă de disciplină, e ordinea firească a lucrului: nu ai ce
 * interpreta pe o hartă goală și nu ai ce transforma într-o convingere pe
 * care n-ai confirmat-o. Înainte arătam ambele file de la început, iar omul
 * intra în ele, le găsea goale și nu înțelegea ce a greșit.
 */
export function stepStates(
  counts: ReturnType<typeof workspaceCounts>,
): Record<WorkspaceTab, StepState> {
  const hasMap = counts.total > 0;
  const hasConfirmed = counts.confirmed > 0;

  return {
    identify: { locked: false, done: hasMap, reason: null },
    interpret: {
      locked: !hasMap,
      done: hasMap && counts.unconfirmed === 0,
      reason: "Se deschide după prima ședință, când harta are ce arăta.",
    },
    transform: {
      locked: !hasConfirmed,
      done: hasConfirmed && counts.resolved > 0 && counts.todo + counts.working === 0,
      reason: hasMap
        ? "Se deschide după ce confirmi prima convingere, la pasul 2."
        : "Se deschide după prima ședință și prima convingere confirmată.",
    },
  };
}

const RESOLVED = "#a0e7c4";

/** Lacătul pașilor încă închiși. Mic, cât o literă. */
function LockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      className="h-3 w-3 shrink-0"
    >
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" />
    </svg>
  );
}

interface Props {
  tab: WorkspaceTab;
  onTab: (tab: WorkspaceTab) => void;
  nodes: MindNode[];
  account: AccountSummary;
  pending: boolean;
  similarPairs: SimilarPair[];
  filters: Filters;
  onFilters: (filters: Filters) => void;
  onFree: () => void;
  onGuide: (guide: Guide) => void;
  onResume: (conversationId: string) => void;
  onTopic: (topic: Topic, domain: LifeDomain) => void;
  onOpenNode: (id: string) => void;
  onChanged: () => void;
  /** Pe telefon panoul e o foaie: are nevoie de un buton de închidere. */
  onClose?: () => void;
}

/** Ce e de făcut pe fiecare pas, ca numere: apar pe file și în bara de jos. */
export function workspaceCounts(nodes: MindNode[]) {
  const live = nodes.filter((n) => n.verdict !== "rejected");
  const confirmed = live.filter(
    (n) => n.verdict === "confirmed" || n.verdict === "edited",
  );
  const unconfirmed = live.filter((n) => n.verdict === "unconfirmed");
  const workable = confirmed.filter(isWorkable);
  return {
    total: live.length,
    confirmed: confirmed.length,
    unconfirmed: unconfirmed.length,
    todo: workable.filter((n) => !n.work_status).length,
    working: workable.filter((n) => n.work_status === "working").length,
    resolved: workable.filter((n) => n.work_status === "resolved").length,
  };
}

/**
 * Panoul de lucru: cele trei etape ale produsului, una lângă alta, în ordinea
 * în care se parcurg. Tot ce se putea face pe hartă se face de aici — nu din
 * butoane împrăștiate pe ecran.
 */
export function Workspace({
  tab,
  onTab,
  nodes,
  account,
  pending,
  similarPairs,
  filters,
  onFilters,
  onFree,
  onGuide,
  onResume,
  onTopic,
  onOpenNode,
  onChanged,
  onClose,
}: Props) {
  const counts = workspaceCounts(nodes);
  const steps = stepStates(counts);
  // Dacă pasul pe care stăteai s-a închis (ai respins tot ce aveai pe hartă),
  // nu rămâi într-o filă goală: te întorci la identificare.
  const active = steps[tab].locked ? "identify" : tab;
  const current = TABS.find((t) => t.id === active)!;
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!hint) return;
    const id = setTimeout(() => setHint(null), 4500);
    return () => clearTimeout(id);
  }, [hint]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-line px-4 pt-4 pb-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
            Cum lucrezi
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-paper-faint hover:text-paper"
            >
              Închide
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {TABS.map((t) => {
            const state = steps[t.id];
            const on = t.id === active;
            const badge =
              t.id === "identify"
                ? null
                : t.id === "interpret"
                  ? counts.unconfirmed
                  : counts.todo + counts.working;
            return (
              <button
                key={t.id}
                onClick={() =>
                  state.locked ? setHint(state.reason) : onTab(t.id)
                }
                aria-label={
                  state.locked
                    ? `Pasul ${t.step}, ${t.label} — încă închis`
                    : undefined
                }
                style={
                  on && !state.locked
                    ? { background: t.color, borderColor: t.color }
                    : undefined
                }
                className={`rounded-xl border px-2 py-2 text-left transition-colors ${
                  on && !state.locked
                    ? "text-ink"
                    : state.locked
                      ? "border-ink-line/60 text-paper-faint"
                      : state.done
                        ? "border-[color:var(--ok)]/50 bg-[color:var(--ok)]/10 text-paper"
                        : "border-ink-line text-paper-dim hover:border-paper-faint hover:text-paper"
                }`}
              >
                <span
                  className={`flex items-center gap-1 text-[10px] ${
                    on && !state.locked ? "text-ink/60" : "text-paper-faint"
                  }`}
                >
                  {state.locked && <LockGlyph />}
                  Pasul {t.step}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium">
                  {t.label}
                  {state.done ? (
                    <span
                      className={`text-[11px] ${on ? "text-ink" : "text-[color:var(--ok)]"}`}
                    >
                      ✓
                    </span>
                  ) : badge ? (
                    <span
                      className={`rounded-full px-1.5 text-[10px] ${
                        on
                          ? "bg-ink/10 text-ink"
                          : "bg-[color:var(--todo)]/15 text-[color:var(--todo)]"
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        {hint ? (
          <p className="mt-3 rounded-xl border border-[color:var(--todo)]/40 bg-[color:var(--todo)]/10 px-3 py-2 text-[13px] leading-relaxed text-[color:var(--todo)]">
            {hint}
          </p>
        ) : (
          <p className="mt-3 text-[13px] leading-relaxed text-paper-dim">
            {current.lead}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {active === "identify" && (
          <IdentifyTab
            account={account}
            pending={pending}
            onFree={onFree}
            onGuide={onGuide}
            onResume={onResume}
            onTopic={onTopic}
            onOpenNode={onOpenNode}
            onChanged={onChanged}
          />
        )}
        {active === "interpret" && (
          <InterpretTab
            nodes={nodes}
            counts={counts}
            similarPairs={similarPairs}
            filters={filters}
            onFilters={onFilters}
            onOpenNode={onOpenNode}
            onChanged={onChanged}
          />
        )}
        {active === "transform" && (
          <TransformTab
            nodes={nodes}
            counts={counts}
            account={account}
            onOpenNode={onOpenNode}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- pasul 1

function IdentifyTab({
  account,
  pending,
  onFree,
  onGuide,
  onResume,
  onTopic,
  onOpenNode,
  onChanged,
}: Pick<
  Props,
  | "account"
  | "pending"
  | "onFree"
  | "onGuide"
  | "onResume"
  | "onTopic"
  | "onOpenNode"
  | "onChanged"
>) {
  const none = account.sessionsLeft === 0;

  return (
    <>
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
          none ? "border-[color:var(--emotion)]/40" : "border-ink-line"
        }`}
      >
        <div>
          <p className="text-sm text-paper">
            {none
              ? "Fără ședințe"
              : `${account.sessionsLeft} ${account.sessionsLeft === 1 ? "ședință rămasă" : "ședințe rămase"}`}
          </p>
          <p className="text-xs text-paper-faint">
            {none
              ? "Lecția introductivă e gratuită. Drumul — cele douăsprezece lecții — se deschide cu un pachet."
              : "O lecție sau o conversație liberă. Reluarea uneia lăsate la jumătate nu costă alta."}
          </p>
        </div>
        <Link
          href="/pachete"
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
            none
              ? "bg-paper text-ink"
              : "border border-ink-line text-paper-dim hover:text-paper"
          }`}
        >
          {none ? "Cumpără" : "Pachete"}
        </Link>
      </div>


      <div className="mt-6">
        <LessonCatalog
          progress={account.lessons}
          sessionsLeft={account.sessionsLeft}
          busy={pending}
          onFree={onFree}
          onStart={onGuide}
          onResume={onResume}
          onTopic={onTopic}
        />
      </div>

      <h3 className="mt-8 text-[11px] tracking-[0.16em] text-paper-faint uppercase">
        Fără ședință
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-paper-faint">
        Îți cunoști deja un tipar sau o frică? Pune-o direct pe hartă,
        confirmată.
      </p>
      <div className="mt-3">
        <AddNodeForm
          onAdded={(id) => {
            onChanged();
            onOpenNode(id);
          }}
        />
      </div>
    </>
  );
}

// ---------------------------------------------------------------- pasul 2

function NodeRow({
  node,
  onOpen,
  trailing,
}: {
  node: MindNode;
  onOpen: (id: string) => void;
  trailing?: React.ReactNode;
}) {
  return (
    <li>
      <button
        onClick={() => onOpen(node.id)}
        className="flex w-full items-center gap-3 rounded-xl border border-ink-line px-3 py-2.5 text-left transition-colors hover:border-paper-faint"
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            background:
              node.work_status === "resolved"
                ? RESOLVED
                : DOMAIN_COLORS[node.domain],
          }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-paper">
            {displayLabel(node)}
          </span>
          <span className="block text-[11px] text-paper-faint">
            {NODE_TYPE_LABELS[node.type]}
          </span>
        </span>
        {trailing}
      </button>
    </li>
  );
}

function InterpretTab({
  nodes,
  counts,
  similarPairs,
  filters,
  onFilters,
  onOpenNode,
  onChanged,
}: Pick<
  Props,
  | "nodes"
  | "similarPairs"
  | "filters"
  | "onFilters"
  | "onOpenNode"
  | "onChanged"
> & {
  counts: ReturnType<typeof workspaceCounts>;
}) {
  const unconfirmed = nodes.filter((n) => n.verdict === "unconfirmed");
  const pct =
    counts.total === 0
      ? 0
      : Math.round((counts.confirmed / counts.total) * 100);

  if (counts.total === 0) {
    return (
      <p className="text-sm leading-relaxed text-paper-faint">
        Harta e goală. După prima ședință, aici apar elementele de confirmat și
        citirea hărții.
      </p>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-ink-line px-4 py-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-paper">
            {counts.confirmed} din {counts.total} confirmate
          </p>
          <span className="text-xs text-paper-faint">{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-line">
          <div
            className="h-full rounded-full bg-paper-dim"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-paper-faint">
          Ce confirmi capătă contur plin pe hartă și poate fi lucrat. Ce
          respingi dispare.
        </p>
      </div>

      {unconfirmed.length > 0 && (
        <>
          <h3 className="mt-6 text-[11px] tracking-[0.16em] text-paper-faint uppercase">
            Te regăsești? · {unconfirmed.length}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {unconfirmed.slice(0, 6).map((node) => (
              <NodeRow
                key={node.id}
                node={node}
                onOpen={onOpenNode}
                trailing={
                  <span className="text-[11px] text-paper-faint">
                    confirmă →
                  </span>
                }
              />
            ))}
          </ul>
          {unconfirmed.length > 6 && (
            <p className="mt-2 text-xs text-paper-faint">
              …și încă {unconfirmed.length - 6}. Le găsești pe hartă, cu contur
              punctat.
            </p>
          )}
        </>
      )}

      <h3 className="mt-6 text-[11px] tracking-[0.16em] text-paper-faint uppercase">
        Citirea de ansamblu
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-paper-faint">
        Ce leagă între ele punctele de pe hartă, și ce comportamente prevăd ele.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <MapReading onOpenNode={onOpenNode} />
        <PredictionPanel onAnswered={onChanged} />
      </div>

      {similarPairs.length > 0 && (
        <div className="mt-6">
          <SimilarityPrompt pairs={similarPairs} onResolved={onChanged} />
        </div>
      )}

      <h3 className="mt-8 text-[11px] tracking-[0.16em] text-paper-faint uppercase">
        Ce arată harta
      </h3>
      <div className="mt-2">
        <MapFilters nodes={nodes} filters={filters} onChange={onFilters} />
      </div>
    </>
  );
}

// ---------------------------------------------------------------- pasul 3

function TransformTab({
  nodes,
  counts,
  account,
  onOpenNode,
}: Pick<Props, "nodes" | "account" | "onOpenNode"> & {
  counts: ReturnType<typeof workspaceCounts>;
}) {
  const workable = nodes.filter(
    (n) =>
      (n.verdict === "confirmed" || n.verdict === "edited") && isWorkable(n),
  );
  const todo = workable.filter((n) => !n.work_status);
  const working = workable.filter((n) => n.work_status === "working");
  const resolved = workable.filter((n) => n.work_status === "resolved");

  if (workable.length === 0) {
    return (
      <>
        <p className="text-sm leading-relaxed text-paper-faint">
          Nimic de lucrat încă. Transformarea pornește de la o convingere, o
          frică sau un tipar pe care le-ai confirmat la pasul 2.
        </p>
        {counts.unconfirmed > 0 && (
          <p className="mt-3 text-sm text-paper-dim">
            Ai {counts.unconfirmed}{" "}
            {counts.unconfirmed === 1 ? "element" : "elemente"} de confirmat.
          </p>
        )}
      </>
    );
  }

  const groups: Array<{
    title: string;
    hint: string;
    items: MindNode[];
    color?: string;
  }> = [
    {
      title: "De lucrat",
      hint: "Confirmate, fără convingere nouă încă. Deschide una și apasă „Lucrăm la asta”.",
      items: todo,
    },
    {
      title: "În lucru",
      hint: "Au o convingere nouă și exerciții. Bifează ce faci, în panoul fiecăreia.",
      items: working,
      color: RESOLVED,
    },
    {
      title: "Rezolvate",
      hint: "Convingerea nouă a fost adoptată. Pe hartă sunt verzi.",
      items: resolved,
      color: RESOLVED,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ["De lucrat", todo.length, null],
          ["În lucru", working.length, RESOLVED],
          ["Rezolvate", resolved.length, RESOLVED],
        ].map(([label, n, color]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-ink-line px-3 py-2.5"
          >
            <p className="text-[10px] tracking-[0.12em] text-paper-faint uppercase">
              {label}
            </p>
            <p
              className="mt-0.5 font-serif text-2xl"
              style={color ? { color: String(color) } : undefined}
            >
              {n}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-paper-faint">
        <span>
          {account.transformationsLeft}{" "}
          {account.transformationsLeft === 1
            ? "transformare disponibilă"
            : "transformări disponibile"}
        </span>
        <Link
          href="/pachete"
          className="underline underline-offset-4 hover:text-paper-dim"
        >
          Pachete
        </Link>
      </div>

      {groups.map((group) =>
        group.items.length === 0 ? null : (
          <section key={group.title} className="mt-6">
            <h3 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              {group.title} · {group.items.length}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-paper-faint">
              {group.hint}
            </p>
            <ul className="mt-2 space-y-1.5">
              {group.items.map((node) => (
                <NodeRow
                  key={node.id}
                  node={node}
                  onOpen={onOpenNode}
                  trailing={
                    node.work_status === "resolved" ? (
                      <span className="text-xs" style={{ color: RESOLVED }}>
                        ✓
                      </span>
                    ) : node.work_status === "working" ? (
                      <span className="text-[11px]" style={{ color: RESOLVED }}>
                        în lucru
                      </span>
                    ) : (
                      <span className="text-[11px] text-paper-faint">
                        lucrăm →
                      </span>
                    )
                  }
                />
              ))}
            </ul>
          </section>
        ),
      )}
    </>
  );
}
