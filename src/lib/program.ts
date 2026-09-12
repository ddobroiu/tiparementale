import { GUIDE_BY_ID, GUIDES, INTRO_GUIDE_ID, type Guide } from "./guides";

/**
 * Lecția introductivă: înaintea drumului, gratuită, o singură dată. Nu e
 * numerotată — drumul începe cu lecția 1 — dar stă în catalog deasupra lui,
 * fiindcă e primul lucru pe care îl face un cont nou.
 */
export const INTRO_GUIDE: Guide = GUIDE_BY_ID.get(INTRO_GUIDE_ID)!;

/**
 * Programul: cele douăsprezece lecții, așezate în module, în ordinea în care
 * are sens să le parcurgi — de la rădăcini spre ce faci azi. Ordinea e o
 * condiție, nu o sugestie: lecția următoare se deschide când cea dinainte e
 * făcută. Vezi `lessonAccess`.
 */

export interface ProgramModule {
  id: string;
  title: string;
  lead: string;
  /** Culoarea capitolului: aceeași pe hartă, în program și pe drum. */
  color: string;
  guideIds: string[];
}

/**
 * Ordinea are un singur criteriu: ce trebuie să știi ca să înțelegi ce
 * urmează. Întâi casa și cei doi oameni din ea (de acolo vine totul), apoi
 * ce ai făcut din tine cu ce ai primit, apoi cum te porți cu ceilalți, apoi
 * banii și munca — unde se văd toate astea în viața de adult — și la final
 * ce transmiți mai departe, care are sens doar după ce ți-ai văzut tiparul.
 */
export const MODULES: ProgramModule[] = [
  {
    id: "radacini",
    title: "Rădăcini",
    lead: "De unde vin tiparele: casa în care ai crescut și cei doi oameni din ea.",
    color: "#f6d186",
    guideIds: [
      "casa-in-care-ai-crescut",
      "relatia-cu-mama",
      "relatia-cu-tata",
    ],
  },
  {
    id: "sine",
    title: "Sinele",
    lead: "Cum ai învățat să te vezi: ce aveai voie să simți, ce se întâmpla când greșeai, rușinea.",
    color: "#c8b6ff",
    guideIds: ["emotiile-acasa", "cand-greseai", "rusinea"],
  },
  {
    id: "relatii",
    title: "Relațiile",
    lead: "Cum te legi de oameni: siguranța învățată devreme, apropierea și retragerea de azi.",
    color: "#d8a0c4",
    guideIds: ["siguranta", "apropiere-si-retragere"],
  },
  {
    id: "bani-munca",
    title: "Bani și muncă",
    lead: "Ce ai moștenit despre bani, despre cât valorezi și despre ce nu delegi.",
    color: "#a2d6f9",
    guideIds: [
      "banii-in-copilarie",
      "munca-si-valoarea",
      "tiparul-care-tine-firma-pe-loc",
    ],
  },
  {
    id: "parinte",
    title: "Ca părinte",
    lead: "Ce transmiți mai departe fără să vrei. Ultima lecție, pentru că are sens doar după celelalte.",
    color: "#ffb4a2",
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

export const MODULE_BY_ID = new Map(MODULES.map((m) => [m.id, m]));

/** Culoarea capitolului din care face parte lecția. */
export function lessonColor(guideId: string): string {
  const lesson = LESSONS.find((l) => l.guide.id === guideId);
  return lesson ? MODULE_BY_ID.get(lesson.moduleId)!.color : "#a7b5cb";
}

const NUMBER_BY_GUIDE = new Map(LESSONS.map((l) => [l.guide.id, l.number]));

export function lessonNumber(guideId: string): number | null {
  return NUMBER_BY_GUIDE.get(guideId) ?? null;
}

/** Orice ghid care nu e în module apare totuși, la final — nimic nu se pierde. */
export const UNLISTED_GUIDES = GUIDES.filter(
  (g) => !NUMBER_BY_GUIDE.has(g.id) && !g.free,
);

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
    spent: progress.turns >= (guide.maxTurns ?? TURNS_PER_SESSION),
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

/** Unde stă o lecție pe drum: făcută, deschisă acum, sau încă închisă. */
export type LessonAccess = "done" | "active" | "locked";

/**
 * Drumul e un lanț: lecția următoare se deschide când cea dinainte e făcută.
 * Motivul nu e disciplina, e claritatea — douăsprezece uși deschise deodată
 * nu sunt libertate, sunt o listă în care omul se pierde. Așa are mereu un
 * singur lucru de făcut, iar ordinea (rădăcini → sine → relații → bani →
 * copii) chiar înseamnă ceva: fiecare lecție se sprijină pe ce a ieșit în
 * cele dinainte.
 *
 * Două excepții, ca nimeni să nu ajungă în fundătură: o lecție deja începută
 * rămâne deschisă oriunde ar fi pe drum, iar una a cărei ședință s-a consumat
 * fără s-o termine lasă drumul să meargă mai departe. Ședința plătită se
 * respectă, oricum ar fi ieșit lecția.
 */
export function lessonAccess(
  progress: LessonProgress[],
): Map<string, LessonAccess> {
  const byGuide = new Map(progress.map((p) => [p.guideId, p]));
  const access = new Map<string, LessonAccess>();
  let opened = false;

  for (const l of LESSONS) {
    const state = lessonState(l.guide, byGuide.get(l.guide.id));
    if (state.kind === "done") {
      access.set(l.guide.id, "done");
      continue;
    }

    // Începută: rămâne deschisă. Oprește drumul doar dacă mai are replici —
    // altfel omul ar sta blocat pe o lecție pe care n-o mai poate continua.
    if (state.kind === "partial") {
      access.set(l.guide.id, "active");
      if (!state.spent) opened = true;
      continue;
    }

    if (!opened) {
      access.set(l.guide.id, "active");
      opened = true;
      continue;
    }
    access.set(l.guide.id, "locked");
  }

  return access;
}

