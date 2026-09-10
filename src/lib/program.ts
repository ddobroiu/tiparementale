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

/**
 * Ce lecție continuă fiecare articol. Articolul explică tiparul la modul
 * general; lecția îl caută în viața omului. Linkul dintre ele duce cititorul
 * de la înțeles la lucrat — și motoarele de căutare, de la o pagină la alta.
 */
const ARTICLE_LESSON: Record<string, string> = {
  "convingeri-limitative": "casa-in-care-ai-crescut",
  "ce-mostenim-de-la-parinti": "casa-in-care-ai-crescut",
  perfectionism: "cand-greseai",
  amanarea: "cand-greseai",
  "vocea-critica": "cand-greseai",
  "nu-sunt-suficient": "rusinea",
  "nevoia-de-control": "siguranta",
  "tipare-care-se-repeta": "apropiere-si-retragere",
  "sa-spui-nu": "apropiere-si-retragere",
  "convingeri-despre-bani": "banii-in-copilarie",
  "sindromul-impostorului": "munca-si-valoarea",
  "comparatia-cu-ceilalti": "munca-si-valoarea",
  "burnout-si-convingeri": "munca-si-valoarea",
  "tiparul-care-tine-firma-pe-loc": "tiparul-care-tine-firma-pe-loc",
  "convingeri-si-copiii-nostri": "ca-parinte",
  "jurnal-de-convingeri": "emotiile-acasa",
};

export function articleLesson(slug: string): (typeof LESSONS)[number] | null {
  const guideId = ARTICLE_LESSON[slug];
  return guideId ? (LESSONS.find((l) => l.guide.id === guideId) ?? null) : null;
}

export function lessonArticles(guideId: string): string[] {
  return Object.entries(ARTICLE_LESSON)
    .filter(([, g]) => g === guideId)
    .map(([slug]) => slug);
}

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
  | { kind: "new"; percent: 0 }
  | {
      kind: "partial";
      /** Câți pași din câți au fost parcurși, în procente. */
      percent: number;
      step: number;
      steps: number;
      conversationId: string;
      /** Închisă înainte de final: se redeschide la reluare, fără altă ședință. */
      closed: boolean;
      /** Replicile s-au consumat: nu se mai poate continua, doar reface. */
      spent: boolean;
    }
  | { kind: "done"; percent: 100; conversationId: string; at: string };

/** O ședință ține atâtea replici; după ele, lecția se reface cu alta. */
const TURNS_PER_SESSION = 25;

/**
 * Starea unei lecții, din ultima ședință pe ea. Procentul e numărul de pași
 * parcurși din câți are lecția — nu cât s-a vorbit. O lecție e făcută când
 * toți pașii au fost trecuți; una începută și lăsată, la orice procent, se
 * reia de unde a rămas cât timp mai are replici în ședința ei.
 */
export function lessonState(
  guide: Guide,
  progress: LessonProgress | undefined,
): LessonState {
  if (!progress || progress.turns === 0) return { kind: "new", percent: 0 };

  const steps = guide.steps.length;
  const done = Math.min(progress.stepIndex, steps);
  if (done >= steps) {
    return {
      kind: "done",
      percent: 100,
      conversationId: progress.conversationId,
      at: progress.closedAt ?? progress.startedAt,
    };
  }

  return {
    kind: "partial",
    percent: Math.round((done / steps) * 100),
    step: done + 1,
    steps,
    conversationId: progress.conversationId,
    closed: progress.closedAt !== null,
    spent: progress.turns >= TURNS_PER_SESSION,
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
