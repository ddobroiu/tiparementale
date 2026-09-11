"use client";

import { useState } from "react";

import type { Guide } from "@/lib/guides";
import {
  LESSONS,
  MODULES,
  UNLISTED_GUIDES,
  lessonAccess,
  lessonMinutes,
  lessonState,
  type LessonProgress,
  type LessonState,
} from "@/lib/program";
import { TOPICS, type Topic } from "@/lib/topics";
import {
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  EXPLORABLE_DOMAINS,
  type LifeDomain,
} from "@/lib/types";

/** Verdele de „reușit", același în toată navigarea (vezi --ok). */
const RESOLVED = "#34d399";

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

function Lock({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      className={`h-3.5 w-3.5 shrink-0 ${className}`}
    >
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" />
    </svg>
  );
}

/**
 * Inelul de progres: procentul, desenat, nu doar scris. La 0 arată numărul
 * lecției; la 100, o bifă; între ele, cât s-a parcurs.
 */
function Ring({ state, number }: { state: LessonState; number: number }) {
  const size = 28;
  const r = 11.5;
  const c = 2 * Math.PI * r;

  return (
    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 h-full w-full -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#23344f"
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
            strokeDasharray={`${c * (state.percent / 100)} ${c}`}
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
 * Programul, ca drum: un lanț de douăsprezece lecții din care e deschisă una
 * singură — următoarea. Cele făcute rămân în urmă ca un rând bifat, cele
 * viitoare stau închise cu lacăt, iar modulele la care nu s-a ajuns încă se
 * strâng fiecare într-un singur rând.
 *
 * Regula care ține ecranul curat: pe listă stau doar numărul, titlul și
 * starea. Rezumatul, pașii și butoanele apar la lecția deschisă — adică
 * exact acolo unde omul are ceva de făcut. Celelalte căi de intrare,
 * conversația liberă și întrebările scurte, stau pliate la final: există,
 * dar nu concurează cu drumul.
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
  const byGuide = new Map(progress.map((p) => [p.guideId, p]));
  const states = new Map(
    LESSONS.map((l) => [
      l.guide.id,
      lessonState(l.guide, byGuide.get(l.guide.id)),
    ]),
  );
  const access = lessonAccess(progress);
  // Lecția la care s-a ajuns: prima deschisă pe care chiar se poate lucra.
  const actives = LESSONS.filter((l) => access.get(l.guide.id) === "active");
  const current =
    actives.find((l) => {
      const s = states.get(l.guide.id)!;
      return s.kind !== "partial" || !s.spent;
    }) ??
    actives[0] ??
    null;

  // `undefined` = nimic atins încă: stă deschisă lecția la care omul a ajuns.
  const [opened, setOpened] = useState<string | null | undefined>(undefined);
  const openId = opened === undefined ? (current?.guide.id ?? null) : opened;
  const [stepsOpen, setStepsOpen] = useState(false);
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [elseOpen, setElseOpen] = useState(false);
  const [topicDomain, setTopicDomain] = useState<LifeDomain | null>(null);

  const done = LESSONS.filter(
    (l) => states.get(l.guide.id)!.kind === "done",
  ).length;
  const overall = Math.round(
    LESSONS.reduce((sum, l) => sum + states.get(l.guide.id)!.percent, 0) /
      LESSONS.length,
  );
  const canStart = sessionsLeft > 0 && !busy;

  const toggle = (id: string) => {
    setOpened(openId === id ? null : id);
    setStepsOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Unde ești pe drum: un număr, o bară, regula în două rânduri. */}
      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
            Drumul · {done} din {LESSONS.length}
          </h3>
          <span className="text-xs text-paper-faint">{overall}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-line">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${overall}%`, background: RESOLVED }}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-paper-faint">
          Pe rând: următoarea se deschide când o termini pe cea dinainte.
        </p>
      </div>

      {MODULES.map((module) => {
        const lessons = LESSONS.filter((l) => l.moduleId === module.id);
        const locked = lessons.every((l) => access.get(l.guide.id) === "locked");
        const doneHere = lessons.filter(
          (l) => states.get(l.guide.id)!.kind === "done",
        ).length;

        // Un modul la care nu s-a ajuns încă: un singur rând, nu patru.
        if (locked) {
          const on = openModule === module.id;
          return (
            <section key={module.id}>
              <button
                onClick={() => setOpenModule(on ? null : module.id)}
                className="flex w-full items-center gap-2 rounded-xl border border-ink-line/60 px-3 py-2.5 text-left"
              >
                <Lock className="text-paper-faint" />
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full opacity-40"
                  style={{ background: module.color }}
                />
                <span className="text-sm text-paper-faint">{module.title}</span>
                <span className="text-[11px] text-paper-faint/70">
                  {lessons.length} {lessons.length === 1 ? "lecție" : "lecții"}
                </span>
                <span className="ml-auto shrink-0 text-[11px] text-paper-faint/70">
                  după lecția {lessons[0].number - 1}
                </span>
              </button>
              {on && (
                <ul className="mt-1.5 space-y-1 pl-8">
                  {lessons.map((l) => (
                    <li
                      key={l.guide.id}
                      className="text-[11px] text-paper-faint/70"
                    >
                      {l.number}. {l.guide.title}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        }

        return (
          <section key={module.id}>
            <h4 className="flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: module.color }}
              />
              <span style={{ color: module.color }}>{module.title}</span>
              <span className="text-paper-faint">
                {doneHere}/{lessons.length}
              </span>
            </h4>
            <ul className="mt-2 space-y-1.5">
              {lessons.map((l) => (
                <LessonRow
                  key={l.guide.id}
                  number={l.number}
                  guide={l.guide}
                  color={module.color}
                  state={states.get(l.guide.id)!}
                  locked={access.get(l.guide.id) === "locked"}
                  open={openId === l.guide.id}
                  stepsOpen={stepsOpen}
                  canStart={canStart}
                  onToggle={() => toggle(l.guide.id)}
                  onSteps={() => setStepsOpen((v) => !v)}
                  onStart={() => onStart(l.guide)}
                  onResume={onResume}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {/* Celelalte căi de intrare, la final și pliate. */}
      <section className="border-t border-ink-line pt-4">
        <button
          onClick={() => setElseOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
            Vrei altceva?
          </span>
          <span className="text-paper-faint">{elseOpen ? "−" : "+"}</span>
        </button>

        {elseOpen && (
          <div className="mt-3 space-y-4">
            <button
              onClick={onFree}
              disabled={!canStart}
              className="w-full rounded-xl border border-ink-line p-3 text-left transition-colors hover:border-paper-faint disabled:opacity-50"
            >
              <span className="text-sm text-paper">Conversație liberă</span>
              <span className="mt-1 block text-[11px] leading-snug text-paper-faint">
                Fără temă. Spui ce ai pe suflet, iar întrebările vin din ce
                spui. Tot o ședință.
              </span>
            </button>

            <div>
              <p className="text-[11px] text-paper-faint">
                Sau o singură întrebare, pe o zonă a vieții:
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
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
                <ul className="mt-2 space-y-1.5">
                  {TOPICS[topicDomain].map((topic) => (
                    <li key={topic.id}>
                      <button
                        disabled={!canStart}
                        onClick={() => onTopic(topic, topicDomain)}
                        className="w-full rounded-xl border border-ink-line p-3 text-left transition-colors hover:border-paper-faint disabled:opacity-50"
                      >
                        <span className="text-sm text-paper">
                          {topic.title}
                        </span>
                        <span className="mt-1 block text-xs leading-snug text-paper-faint">
                          {topic.opener}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {UNLISTED_GUIDES.length > 0 && (
              <div>
                <p className="text-[11px] text-paper-faint">
                  Lecții în afara drumului:
                </p>
                <ul className="mt-2 space-y-1.5">
                  {UNLISTED_GUIDES.map((guide) => (
                    <li key={guide.id}>
                      <button
                        disabled={!canStart}
                        onClick={() => onStart(guide)}
                        className="w-full rounded-xl border border-ink-line px-3 py-2.5 text-left transition-colors hover:border-paper-faint disabled:opacity-50"
                      >
                        <span className="text-sm text-paper">
                          {guide.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-paper-faint">
                          {guide.steps.length} pași · ~{lessonMinutes(guide)}{" "}
                          min
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Un rând de lecție. Închis: lacăt, număr, titlu și după ce se deschide.
 * Făcut: bifă, titlu, data. Deschis: tot ce e de făcut acum, și atât.
 */
function LessonRow({
  number,
  guide,
  color,
  state,
  locked,
  open,
  stepsOpen,
  canStart,
  onToggle,
  onSteps,
  onStart,
  onResume,
}: {
  number: number;
  guide: Guide;
  color: string;
  state: LessonState;
  locked: boolean;
  open: boolean;
  stepsOpen: boolean;
  canStart: boolean;
  onToggle: () => void;
  onSteps: () => void;
  onStart: () => void;
  onResume: (conversationId: string) => void;
}) {
  if (locked) {
    return (
      <li className="flex items-center gap-3 rounded-xl border border-ink-line/60 px-3 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center">
          <Lock className="text-paper-faint/70" />
        </span>
        <span className="line-clamp-2 min-w-0 flex-1 text-sm text-paper-faint">
          {number}. {guide.title}
        </span>
        <span className="shrink-0 text-[11px] text-paper-faint/70">
          după lecția {number - 1}
        </span>
      </li>
    );
  }

  const resumable = state.kind === "partial" && !state.spent;
  const next =
    state.kind === "partial"
      ? guide.steps[Math.min(state.step - 1, guide.steps.length - 1)]
      : guide.steps[0];

  return (
    <li
      style={open ? { borderColor: color } : undefined}
      className={`overflow-hidden rounded-xl border transition-colors ${
        open ? "bg-ink-soft" : "border-ink-line hover:border-paper-faint/60"
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
              style={{
                background: color,
                opacity: state.kind === "done" ? 0.4 : 1,
              }}
            />
            <span
              className={`line-clamp-2 text-sm ${
                state.kind === "done" ? "text-paper-dim" : "text-paper"
              }`}
            >
              {guide.title}
            </span>
          </span>
          <span className="mt-0.5 block text-[11px] text-paper-faint">
            {state.kind === "done" ? (
              <>făcută pe {dateShort(state.at)}</>
            ) : state.kind === "partial" ? (
              <span className="text-[color:var(--value)]">
                pasul {state.step} din {state.steps}
                {state.spent ? ", ședință consumată" : ""}
              </span>
            ) : (
              <>
                {guide.steps.length} pași · ~{lessonMinutes(guide)} min · rândul
                tău
              </>
            )}
          </span>
        </span>
        <span className="text-paper-faint">{open ? "−" : "+"}</span>
      </button>

      {state.kind === "partial" && (
        <div className="h-0.5 w-full bg-ink-line">
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${state.percent}%`, background: RESOLVED }}
          />
        </div>
      )}

      {open && (
        <div className="px-3 pt-2.5 pb-3">
          <p className="text-[13px] leading-relaxed text-paper-dim">
            {guide.summary}
          </p>

          {state.kind !== "done" && (
            <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-paper-faint">
              {state.kind === "partial" ? "Urmează" : "Începe cu"}: „
              {next.question}”
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {resumable && (
              <button
                onClick={() => onResume(state.conversationId)}
                style={{ background: color }}
                className="rounded-full px-4 py-1.5 text-xs font-medium text-ink"
              >
                Continuă de la {state.percent}% · fără ședință nouă
              </button>
            )}
            <button
              onClick={onStart}
              disabled={!canStart}
              style={
                resumable || state.kind === "done"
                  ? undefined
                  : { background: color }
              }
              className={`rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40 ${
                resumable || state.kind === "done"
                  ? "border border-ink-line text-paper-dim"
                  : "text-ink"
              }`}
            >
              {state.kind === "done"
                ? "Refă lecția · 1 ședință"
                : state.kind === "partial"
                  ? "Începe din nou · 1 ședință"
                  : "Începe · 1 ședință"}
            </button>
          </div>

          <button
            onClick={onSteps}
            className="mt-2.5 text-[11px] text-paper-faint hover:text-paper-dim"
          >
            {stepsOpen ? "− ascunde pașii" : `+ cei ${guide.steps.length} pași`}
          </button>

          {stepsOpen && (
            <ol className="mt-2 space-y-1">
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
          )}
        </div>
      )}
    </li>
  );
}
