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
 * Programul, ca listă: conversația liberă întâi, la același rang cu lecțiile;
 * apoi cele douăsprezece lecții pe module, fiecare cu starea ei; la urmă
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
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [topicDomain, setTopicDomain] = useState<LifeDomain | null>(null);

  const byGuide = new Map(progress.map((p) => [p.guideId, p]));
  const done = LESSONS.filter(
    (l) => lessonState(l.guide, byGuide.get(l.guide.id)).kind === "done",
  );
  const next = nextLesson(progress);
  const canStart = sessionsLeft > 0 && !busy;

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

      {/* Programul. */}
      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
            Programul · {LESSONS.length} lecții
          </h3>
          <span className="text-xs text-paper-faint">
            {done.length} {done.length === 1 ? "făcută" : "făcute"}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-line">
          <div
            className="h-full rounded-full bg-[color:var(--value)]"
            style={{ width: `${(done.length / LESSONS.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-paper-faint">
          O lecție = o ședință. Le faci în orice ordine; cea de mai jos e doar
          drumul recomandat, de la rădăcini spre ce faci azi.
        </p>

        {next && done.length > 0 && (
          <button
            onClick={() => onStart(next.guide)}
            disabled={!canStart}
            className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-paper-faint/60 bg-ink-soft px-4 py-3 text-left disabled:opacity-50"
          >
            <span>
              <span className="block text-[10px] tracking-[0.14em] text-paper-faint uppercase">
                Continuă programul
              </span>
              <span className="block text-sm text-paper">
                Lecția {next.number} · {next.guide.title}
              </span>
            </span>
            <span className="text-paper-faint">→</span>
          </button>
        )}
      </div>

      {MODULES.map((module) => {
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
                  state={lessonState(l.guide, byGuide.get(l.guide.id))}
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

      {UNLISTED_GUIDES.length > 0 && (
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

  return (
    <li
      className={`rounded-xl border transition-colors ${
        open
          ? "border-paper-faint bg-ink-soft"
          : "border-ink-line hover:border-paper-faint/60"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left"
      >
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
            state.kind === "done"
              ? "bg-[color:var(--value)] text-ink"
              : state.kind === "in_progress"
                ? "border border-[color:var(--value)] text-[color:var(--value)]"
                : "border border-ink-line text-paper-faint"
          }`}
        >
          {state.kind === "done" ? "✓" : number}
        </span>
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
            {state.kind === "in_progress" && (
              <span className="text-[color:var(--value)]">
                {" "}
                · în curs, pasul {state.step} din {state.steps}
              </span>
            )}
            {state.kind === "done" && (
              <span> · făcută pe {dateShort(state.closedAt)}</span>
            )}
          </span>
        </span>
        <span className="text-paper-faint">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="px-3 pb-3">
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

          <p className="mt-2 text-[11px] leading-snug text-paper-faint">
            Prima întrebare: „{guide.steps[0].question}”
          </p>
          <p className="mt-1 text-[10px] leading-snug text-paper-faint/80">
            După {guide.sources.slice(0, 2).join(" · ")}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {state.kind === "in_progress" && (
              <button
                onClick={() => onResume(state.conversationId)}
                disabled={!canStart && false}
                className="rounded-full bg-paper px-4 py-1.5 text-xs font-medium text-ink"
              >
                Reia de unde am rămas
              </button>
            )}
            <button
              onClick={onStart}
              disabled={!canStart}
              className={`rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40 ${
                state.kind === "in_progress"
                  ? "border border-ink-line text-paper-dim"
                  : "bg-paper text-ink"
              }`}
            >
              {state.kind === "done"
                ? "Refă lecția · 1 ședință"
                : state.kind === "in_progress"
                  ? "Începe din nou · 1 ședință"
                  : "Începe · 1 ședință"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
