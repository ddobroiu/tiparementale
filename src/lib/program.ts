import { GUIDE_BY_ID, GUIDES, type Guide } from "./guides";

/**
 * Programul: cele douăsprezece lecții, așezate în module, în ordinea în care
 * are sens să le parcurgi — de la rădăcini spre ce faci azi. Ordinea e o
 * recomandare, nu o condiție: orice lecție se poate începe oricând, cu o
 * singură ședință. Cine vrea să sară direct la bani sau la relații, sare.
 */

export interface ProgramModule {
  id: string;
  title: string;
  lead: string;
  guideIds: string[];
}

export const MODULES: ProgramModule[] = [
  {
    id: "radacini",
    title: "Rădăcini",
    lead: "De unde vin tiparele: casa, mama, tata, felul în care ai învățat să fii în siguranță.",
    guideIds: [
      "casa-in-care-ai-crescut",
      "relatia-cu-mama",
      "relatia-cu-tata",
      "siguranta",
    ],
  },
  {
    id: "sine",
    title: "Sinele",
    lead: "Cum ai învățat să te vezi: ce se întâmpla când greșeai, ce aveai voie să simți, rușinea.",
    guideIds: ["cand-greseai", "emotiile-acasa", "rusinea"],
  },
  {
    id: "relatii",
    title: "Relațiile",
    lead: "Apropierea și retragerea, învățate devreme și repetate cu oameni diferiți.",
    guideIds: ["apropiere-si-retragere"],
  },
  {
    id: "bani-munca",
    title: "Bani și muncă",
    lead: "Ce ai moștenit despre bani, despre cât valorezi și despre ce nu delegi.",
    guideIds: [
      "banii-in-copilarie",
      "munca-si-valoarea",
      "tiparul-care-tine-firma-pe-loc",
    ],
  },
  {
    id: "parinte",
    title: "Ca părinte",
    lead: "Ce transmiți mai departe fără să vrei.",
    guideIds: ["ca-parinte"],
  },
];

/** Lecțiile, în ordinea programului, numerotate de la 1. */
export const LESSONS: Array<{
  number: number;
  guide: Guide;
  moduleId: string;
}> = MODULES.flatMap((m) =>
  m.guideIds.map((id) => ({ guide: GUIDE_BY_ID.get(id)!, moduleId: m.id })),
).map((l, i) => ({ number: i + 1, ...l }));

const NUMBER_BY_GUIDE = new Map(LESSONS.map((l) => [l.guide.id, l.number]));

export function lessonNumber(guideId: string): number | null {
  return NUMBER_BY_GUIDE.get(guideId) ?? null;
}

/** Orice ghid care nu e în module apare totuși, la final — nimic nu se pierde. */
export const UNLISTED_GUIDES = GUIDES.filter((g) => !NUMBER_BY_GUIDE.has(g.id));

/** Cât durează o lecție, cu aproximație: trei minute de pas. */
export function lessonMinutes(guide: Guide): number {
  return guide.steps.length * 3;
}

/** Ultima ședință pe o lecție, așa cum o ține baza. */
export interface LessonProgress {
  guideId: string;
  conversationId: string;
  turns: number;
  stepIndex: number;
  startedAt: string;
  closedAt: string | null;
}

export type LessonState =
  | { kind: "new" }
  | { kind: "in_progress"; step: number; steps: number; conversationId: string }
  | { kind: "done"; closedAt: string; conversationId: string };

/**
 * Starea unei lecții din ultima ședință pe ea. Închisă înseamnă făcută,
 * indiferent cât s-a vorbit — omul decide când a terminat. Neînchisă cu
 * replici înseamnă că se poate relua de unde a rămas.
 */
export function lessonState(
  guide: Guide,
  progress: LessonProgress | undefined,
): LessonState {
  if (!progress) return { kind: "new" };
  if (progress.closedAt) {
    return {
      kind: "done",
      closedAt: progress.closedAt,
      conversationId: progress.conversationId,
    };
  }
  return {
    kind: "in_progress",
    step: Math.min(progress.stepIndex + 1, guide.steps.length),
    steps: guide.steps.length,
    conversationId: progress.conversationId,
  };
}

/** Prima lecție nefăcută, în ordinea programului: „continuă de aici”. */
export function nextLesson(
  progress: LessonProgress[],
): (typeof LESSONS)[number] | null {
  const byGuide = new Map(progress.map((p) => [p.guideId, p]));
  return (
    LESSONS.find(
      (l) => lessonState(l.guide, byGuide.get(l.guide.id)).kind !== "done",
    ) ?? null
  );
}
