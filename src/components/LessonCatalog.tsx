"use client";

import { useState } from "react";

import type { Guide } from "@/lib/guides";
import {
  LESSONS,
  MODULES,
  UNLISTED_GUIDES,
  lessonMinutes,
  lessonState,
  nextLesson,
  type LessonProgress,
  type LessonState,
} from "@/lib/program";
import { SCHEMA_BY_CODE } from "@/lib/schemas";
import { TOPICS, type Topic } from "@/lib/topics";
import {
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  EXPLORABLE_DOMAINS,
  type LifeDomain,
} from "@/lib/types";

const RESOLVED = "#a0e7c4";

interface Props {
  progress: LessonProgress[];
  sessionsLeft: number;
  busy: boolean;
  onFree: () => void;
  onStart: (guide: Guide) => void;
  onResume: (conversationId: string) => void;
  onTopic: (topic: Topic, domain: LifeDomain) => void;
}

function dateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
  });
}

/** Numele scurt al schemei: „Abandon / instabilitate” → „Abandon”. */
function schemaShort(code: string): string | null {
  const s = SCHEMA_BY_CODE.get(code);
  return s ? s.name.split(" / ")[0] : null;
}

/**
 * Inelul de progres: procentul, desenat, nu doar scris. La 0 arată numărul
 * lecției; la 100, o bifă; între ele, cât s-a parcurs.
 */
function Ring({ state, number }: { state: LessonState; number: number }) {
  const size = 30;
  const r = 12.5;
  const c = 2 * Math.PI * r;
  const filled = state.percent / 100;

  return (
    <span className="relative flex h-[30px] w-[30px] shrink-0 items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 h-full w-full -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#22222e"
          strokeWidth={2}
        />
        {state.percent > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill={state.kind === "done" ? RESOLVED : "none"}
            stroke={RESOLVED}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={`${c * filled} ${c}`}
            className="transition-all duration-700"
          />
        )}
      </svg>
      <span
        className={`relative text-[10px] font-medium ${
          state.kind === "done"
            ? "text-ink"
            : state.kind === "partial"
              ? "text-[color:var(--value)]"
              : "text-paper-faint"
        }`}
      >
        {state.kind === "done"
          ? "✓"
          : state.kind === "partial"
            ? `${state.percent}%`
            : number}
      </span>
    </span>
  );
}

/**
 * Programul, ca listă: conversația liberă întâi, la același rang cu lecțiile;
 * apoi cele douăsprezece lecții pe module, fiecare cu procentul ei; la urmă
 * întrebările scurte. Nimic nu e blocat: orice lecție se începe oricând, cu o
 * ședință, în orice ordine. Ordinea afișată e doar drumul recomandat.
 */
export function LessonCatalog({
  progress,
  sessionsLeft,
  busy,
  onFree,
  onStart,
  onResume,
  onTopic,
}: Props) {
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [topicDomain, setTopicDomain] = useState<LifeDomain | null>(null);

  const byGuide = new Map(progress.map((p) => [p.guideId, p]));
  const states = new Map(
    LESSONS.map((l) => [
      l.guide.id,
      lessonState(l.guide, byGuide.get(l.guide.id)),
    ]),
  );
  const done = LESSONS.filter(
    (l) => states.get(l.guide.id)!.kind === "done",
  ).length;
  const overall = Math.round(
    LESSONS.reduce((sum, l) => sum + states.get(l.guide.id)!.percent, 0) /
      LESSONS.length,
  );
  const next = nextLesson(progress);
  const canStart = sessionsLeft > 0 && !busy;
  const visibleModules = MODULES.filter(
    (m) => moduleFilter === null || m.id === moduleFilter,
  );

  return (
    <div className="space-y-6">
      {/* Conversația liberă: opțiune întreagă, nu notă de subsol. */}
      <button
        onClick={onFree}
        disabled={!canStart}
        className="w-full rounded-2xl border border-ink-line p-4 text-left transition-colors hover:border-paper-faint disabled:opacity-50"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="font-serif text-[17px] text-paper">
            Conversație liberă
          </span>
          <span className="shrink-0 rounded-full border border-ink-line px-2 py-0.5 text-[10px] tracking-[0.12em] text-paper-faint uppercase">
            1 ședință
          </span>
        </span>
        <span className="mt-1.5 block text-[13px] leading-snug text-paper-dim">
          Fără temă. Spui ce ai pe suflet, iar întrebările vin din ce spui.
          Harta se completează la fel ca într-o lecție.
        </span>
      </button>

      {/* Programul: progres total, filtre pe module, continuarea. */}
      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
            Programul · {LESSONS.length} lecții
          </h3>
          <span className="text-xs text-paper-faint">
            {done} {done === 1 ? "făcută" : "făcute"} · {overall}%
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-line">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${overall}%`, background: RESOLVED }}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-paper-faint">
          O lecție = o ședință. Le faci în orice ordine; cea de mai jos e doar
          drumul recomandat. Procentul e cât ai parcurs din pașii lecției.
        </p>

        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setModuleFilter(null)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors ${
              moduleFilter === null
                ? "border-paper bg-paper text-ink"
                : "border-ink-line text-paper-dim hover:border-paper-faint"
            }`}
          >
            Toate
          </button>
          {MODULES.map((m) => {
            const lessons = LESSONS.filter((l) => l.moduleId === m.id);
            const doneHere = lessons.filter(
              (l) => states.get(l.guide.id)!.kind === "done",
            ).length;
            const on = moduleFilter === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setModuleFilter(on ? null : m.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors ${
                  on
                    ? "border-paper bg-paper text-ink"
                    : "border-ink-line text-paper-dim hover:border-paper-faint"
                }`}
              >
                {m.title}
                <span className={on ? "text-ink/60" : "text-paper-faint"}>
                  {doneHere}/{lessons.length}
                </span>
              </button>
            );
          })}
        </div>

        {next && (done > 0 || overall > 0) && (
          <button
            onClick={() => {
              const st = states.get(next.guide.id)!;
              if (st.kind === "partial" && !st.spent)
                onResume(st.conversationId);
              else onStart(next.guide);
            }}
            disabled={
              !canStart && states.get(next.guide.id)!.kind !== "partial"
            }
            className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-paper-faint/60 bg-ink-soft px-4 py-3 text-left disabled:opacity-50"
          >
            <span>
              <span className="block text-[10px] tracking-[0.14em] text-paper-faint uppercase">
                Continuă programul
              </span>
              <span className="block text-sm text-paper">
                Lecția {next.number} · {next.guide.title}
                {states.get(next.guide.id)!.kind === "partial" && (
                  <span className="text-[color:var(--value)]">
                    {" "}
                    · {states.get(next.guide.id)!.percent}%
                  </span>
                )}
              </span>
            </span>
            <span className="text-paper-faint">→</span>
          </button>
        )}
      </div>

      {visibleModules.map((module) => {
        const lessons = LESSONS.filter((l) => l.moduleId === module.id);
        return (
          <section key={module.id}>
            <h4 className="font-serif text-[15px] text-paper">
              {module.title}
            </h4>
            <p className="mt-0.5 text-xs leading-snug text-paper-faint">
              {module.lead}
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {lessons.map((l) => (
                <LessonRow
                  key={l.guide.id}
                  number={l.number}
                  guide={l.guide}
                  state={states.get(l.guide.id)!}
                  open={openLesson === l.guide.id}
                  canStart={canStart}
                  onToggle={() =>
                    setOpenLesson(openLesson === l.guide.id ? null : l.guide.id)
                  }
                  onStart={() => onStart(l.guide)}
                  onResume={onResume}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {moduleFilter === null && UNLISTED_GUIDES.length > 0 && (
        <section>
          <h4 className="font-serif text-[15px] text-paper">Alte lecții</h4>
          <ul className="mt-2.5 space-y-1.5">
            {UNLISTED_GUIDES.map((guide, i) => (
              <LessonRow
                key={guide.id}
                number={LESSONS.length + i + 1}
                guide={guide}
                state={lessonState(guide, byGuide.get(guide.id))}
                open={openLesson === guide.id}
                canStart={canStart}
                onToggle={() =>
                  setOpenLesson(openLesson === guide.id ? null : guide.id)
                }
                onStart={() => onStart(guide)}
                onResume={onResume}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Întrebările scurte: a treia cale, pliată. */}
      <section className="border-t border-ink-line pt-4">
        <button
          onClick={() => setTopicsOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span>
            <span className="block text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              Întrebări scurte
            </span>
            <span className="mt-0.5 block text-xs text-paper-faint">
              O singură întrebare, pe o zonă a vieții. Tot o ședință.
            </span>
          </span>
          <span className="text-paper-faint">{topicsOpen ? "−" : "+"}</span>
        </button>

        {topicsOpen && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5">
              {EXPLORABLE_DOMAINS.map((domain) => {
                const on = topicDomain === domain;
                return (
                  <button
                    key={domain}
                    onClick={() => setTopicDomain(on ? null : domain)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      on
                        ? "border-paper-faint text-paper"
                        : "border-ink-line text-paper-dim hover:border-paper-faint"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: DOMAIN_COLORS[domain] }}
                    />
                    {DOMAIN_LABELS[domain]}
                  </button>
                );
              })}
            </div>
            {topicDomain && (
              <ul className="mt-3 space-y-1.5">
                {TOPICS[topicDomain].map((topic) => (
                  <li key={topic.id}>
                    <button
                      disabled={!canStart}
                      onClick={() => onTopic(topic, topicDomain)}
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
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function LessonRow({
  number,
  guide,
  state,
  open,
  canStart,
  onToggle,
  onStart,
  onResume,
}: {
  number: number;
  guide: Guide;
  state: LessonState;
  open: boolean;
  canStart: boolean;
  onToggle: () => void;
  onStart: () => void;
  onResume: (conversationId: string) => void;
}) {
  const schemas = [...new Set(guide.steps.flatMap((s) => s.schemas))]
    .map(schemaShort)
    .filter((s): s is string => Boolean(s))
    .slice(0, 4);
  const resumable = state.kind === "partial" && !state.spent;

  return (
    <li
      className={`overflow-hidden rounded-xl border transition-colors ${
        open
          ? "border-paper-faint bg-ink-soft"
          : "border-ink-line hover:border-paper-faint/60"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <Ring state={state} number={number} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: DOMAIN_COLORS[guide.domain] }}
            />
            <span className="truncate text-sm text-paper">{guide.title}</span>
          </span>
          <span className="mt-0.5 block text-[11px] text-paper-faint">
            {guide.steps.length} pași · ~{lessonMinutes(guide)} min
            {state.kind === "partial" && (
              <span className="text-[color:var(--value)]">
                {" "}
                · pasul {state.step} din {state.steps}
                {state.spent ? ", ședință consumată" : ""}
              </span>
            )}
            {state.kind === "done" && (
              <span> · făcută pe {dateShort(state.at)}</span>
            )}
          </span>
        </span>
        <span className="text-paper-faint">{open ? "−" : "+"}</span>
      </button>

      {/* Linia de progres de la baza cardului: se vede și fără să deschizi. */}
      {state.percent > 0 && (
        <div className="h-0.5 w-full bg-ink-line">
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${state.percent}%`, background: RESOLVED }}
          />
        </div>
      )}

      {open && (
        <div className="px-3 pt-3 pb-3">
          <p className="text-[13px] leading-relaxed text-paper-dim">
            {guide.summary}
          </p>

          {schemas.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-1.5">
              {schemas.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-ink-line px-2 py-0.5 text-[10px] text-paper-faint"
                >
                  {s}
                </span>
              ))}
            </p>
          )}

          {/* Pașii, ca listă: cei parcurși bifați, următorul marcat. */}
          <ol className="mt-3 space-y-1">
            {guide.steps.map((step, i) => {
              const passed =
                state.kind === "done" ||
                (state.kind === "partial" && i < state.step - 1);
              const current = state.kind === "partial" && i === state.step - 1;
              return (
                <li
                  key={step.id}
                  className="flex items-start gap-2 text-[11px] leading-snug"
                >
                  <span
                    className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[8px] ${
                      passed
                        ? "border-[color:var(--value)] bg-[color:var(--value)] text-ink"
                        : current
                          ? "border-[color:var(--value)] text-[color:var(--value)]"
                          : "border-ink-line text-paper-faint"
                    }`}
                  >
                    {passed ? "✓" : i + 1}
                  </span>
                  <span
                    className={
                      passed
                        ? "text-paper-faint line-through decoration-ink-line"
                        : current
                          ? "text-paper"
                          : "text-paper-faint"
                    }
                  >
                    {step.question}
                  </span>
                </li>
              );
            })}
          </ol>

          <p className="mt-2 text-[10px] leading-snug text-paper-faint/80">
            După {guide.sources.slice(0, 2).join(" · ")}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {resumable && (
              <button
                onClick={() => onResume(state.conversationId)}
                className="rounded-full bg-paper px-4 py-1.5 text-xs font-medium text-ink"
              >
                Continuă de la {state.percent}% · fără ședință nouă
              </button>
            )}
            <button
              onClick={onStart}
              disabled={!canStart}
              className={`rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40 ${
                resumable
                  ? "border border-ink-line text-paper-dim"
                  : "bg-paper text-ink"
              }`}
            >
              {state.kind === "done"
                ? "Refă lecția · 1 ședință"
                : state.kind === "partial"
                  ? "Începe din nou · 1 ședință"
                  : "Începe · 1 ședință"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
