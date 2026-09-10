"use client";

import Link from "next/link";

import type { Guide } from "@/lib/guides";
import { lessonNumber } from "@/lib/program";
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
}> = [
  {
    id: "identify",
    step: 1,
    label: "Identificare",
    lead: "Ședințele construiesc harta. Alegi o temă, povestești, iar din ce spui apar convingerile, valorile și fricile tale.",
  },
  {
    id: "interpret",
    step: 2,
    label: "Interpretare",
    lead: "Harta se citește. Confirmi ce e adevărat, respingi ce nu e, și ceri o citire de ansamblu.",
  },
  {
    id: "transform",
    step: 3,
    label: "Transformare",
    lead: "Pe fiecare convingere confirmată se lucrează: o convingere nouă, exerciții, bifezi ce ai făcut. Când o simți ca a ta, o marchezi rezolvată și devine verde pe hartă.",
  },
];

const RESOLVED = "#a0e7c4";

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
  const current = TABS.find((t) => t.id === tab)!;

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
            const on = t.id === tab;
            const badge =
              t.id === "identify"
                ? null
                : t.id === "interpret"
                  ? counts.unconfirmed
                  : counts.todo + counts.working;
            return (
              <button
                key={t.id}
                onClick={() => onTab(t.id)}
                className={`rounded-xl border px-2 py-2 text-left transition-colors ${
                  on
                    ? "border-paper bg-paper text-ink"
                    : "border-ink-line text-paper-dim hover:border-paper-faint hover:text-paper"
                }`}
              >
                <span
                  className={`block text-[10px] ${on ? "text-ink/60" : "text-paper-faint"}`}
                >
                  Pasul {t.step}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium">
                  {t.label}
                  {badge ? (
                    <span
                      className={`rounded-full px-1.5 text-[10px] ${
                        on ? "bg-ink/10 text-ink" : "bg-ink-line text-paper-dim"
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

        <p className="mt-3 text-[13px] leading-relaxed text-paper-dim">
          {current.lead}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {tab === "identify" && (
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
        {tab === "interpret" && (
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
        {tab === "transform" && (
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
  const inProgress = account.lessons.filter((l) => !l.closedAt && l.turns > 0);

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
              ? "Nu mai ai ședințe"
              : `${account.sessionsLeft} ${account.sessionsLeft === 1 ? "ședință rămasă" : "ședințe rămase"}`}
          </p>
          <p className="text-xs text-paper-faint">
            O ședință = o lecție sau o conversație liberă, la alegere, în orice
            ordine.
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

      {inProgress.length > 0 && (
        <div className="mt-4 rounded-xl border border-[color:var(--value)]/40 px-4 py-3">
          <p className="text-[10px] tracking-[0.14em] text-paper-faint uppercase">
            Lecție în curs
          </p>
          {inProgress.map((l) => (
            <button
              key={l.conversationId}
              onClick={() => onResume(l.conversationId)}
              className="mt-1.5 flex w-full items-center justify-between gap-3 text-left text-sm text-paper hover:underline"
            >
              <span>
                Lecția {lessonNumber(l.guideId) ?? "·"} · pasul{" "}
                {l.stepIndex + 1}
              </span>
              <span className="text-xs text-[color:var(--value)]">reia →</span>
            </button>
          ))}
          <p className="mt-1.5 text-[11px] text-paper-faint">
            Reluarea nu costă o ședință nouă.
          </p>
        </div>
      )}

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
