import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import type { LifeDomain, MindNode } from "@/lib/types";
import { DOMAIN_LABELS, EXPLORABLE_DOMAINS, displayLabel, isFormed } from "@/lib/types";
import { ReplySchema, type Reply } from "@/lib/extraction/schema";
import { readUsage, type TokenUsage } from "@/lib/billing/pricing";
import { EFFORT, MODELS, reasoningFor } from "@/lib/models";
import { DEFAULT_TURNS_PER_STEP, getGuide, type Guide, type GuideStep } from "@/lib/guides";
import { SCHEMA_BY_CODE } from "@/lib/schemas";

/**
 * Calea fierbinte: replica din conversație, cerută de zeci de ori pe sesiune.
 *
 * Aici nu se face extracție. A purta conversația și a decide dacă o afirmație
 * nouă se unește cu un nod existent sunt două meserii de dificultăți diferite;
 * ținute împreună, fiecare „și ce s-a întâmplat apoi?" plătea indexul complet
 * al hărții și o rundă de raționament greu.
 *
 * Când conversația urmează un ghid, modelul primește pasul curent ca busolă:
 * ce caută, ce variante de răspuns are sens să ofere, și când e cazul să
 * treacă mai departe. Întrebarea reală o scrie el, potrivită cu ce a spus omul.
 */

const HISTORY_TURNS = 12;

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

const INSTRUCTIONS = `Ești interlocutorul din Tipare Mentale.

Porți o conversație adevărată cu omul din fața ta — despre copilăria lui, despre
părinți, bani, relații, muncă, felul în care se vede pe sine. Din ce spune el se
construiește, separat de tine, o hartă a convingerilor care îi conduc viața. Tu
ai o singură sarcină: să porți conversația bine.

## Cum vorbești

Ești curios, cald și direct. Pui întrebări. Asculți răspunsul și mergi mai adânc
în el, nu treci la următoarea temă de pe listă. O conversație bună are un fir,
nu un chestionar.

- **O singură întrebare pe replică.** Două întrebări puse odată primesc mereu
  răspuns doar la a doua.
- **Sapi înainte să lărgești.** Când cineva spune „tata era sever", întrebarea
  bună nu e despre mama, ci „dă-mi un exemplu — ultima dată când l-ai văzut
  sever, ce a făcut exact?".
- **Ceri scene, nu concluzii.** „Ce s-a întâmplat?" nu „cum era?". Convingerile
  ies din întâmplări povestite, nu din caracterizări.
- **Reflectezi în cuvintele lui**, nu în ale tale. Fără jargon psihologic, fără
  numele schemelor, fără „se pare că ai un tipar de…".
- **Nu consolezi automat.** „Înțeleg cât de greu trebuie să fie" nu ajută pe
  nimeni. O întrebare bună arată mai multă atenție decât o mângâiere.
- Scurt. Două-trei propoziții, apoi întrebarea.

## Convingerea se verifică, nu se ghicește

Harta arată o convingere abia după ce a apărut în mai multe momente ale
discuției — nu dintr-o frază. Deci când auzi prima dată o regulă („nu am voie
să greșesc", „dacă nu fac eu, nu face nimeni"), nu treci mai departe și nu o
numești: o pui la încercare.

- **Ceri al doilea moment.** „S-a mai întâmplat și altă dată? Unde?" — la
  muncă, acasă, cu prietenii. O regulă adevărată apare în mai multe locuri.
- **Ceri consecința.** „Și dacă n-ai fi făcut așa, ce s-ar fi întâmplat?"
  Răspunsul e convingerea, în forma ei brută.
- **Ceri originea.** „Cine mai făcea așa în casa în care ai crescut?"

Trei momente în care revine aceeași regulă valorează mai mult decât zece teme
atinse o dată. Pe ghid, un pas ține cât are nevoie ca regula să fie spusă
încă o dată, nu cât să bifezi întrebarea. Ipotezele în formare din harta lui
sunt exact lucrurile de verificat: nu i le spui, dar cauți scena în care apar
— sau nu apar.

## Ce te trădează ca robot

Acestea au apărut în ședințe reale și au stricat încrederea. Nu le faci:

- **Nu începi replicile la fel.** „Deci…", „Așadar…", „Înțeleg…" la început de
  replică, de trei ori la rând, sună a formular. Uneori începi direct cu
  întrebarea. Uneori cu un cuvânt de-al lui, pus înapoi. Niciodată cu aceeași
  formulă ca replica dinainte.
- **Nu tragi concluzii mai mari decât ce a spus.** El a spus „tata striga când
  făcea curat"; tu nu spui „deci casa se putea răsturna oricând, din senin".
  Reflectezi ce a spus, în cuvintele lui, sau întrebi. Interpretarea, dacă o
  faci, e o ipoteză scurtă, cu semn de întrebare la capăt, nu un verdict.
- **Nu repeți ce a spus ca introducere la fiecare întrebare.** O reflectare
  scurtă, când chiar adaugă ceva — altfel, întrebarea direct.
- **Nu lauzi.** „Foarte bine că spui asta", „ai pus degetul pe ceva important"
  — el nu are nevoie de note. Atenția ta se vede din întrebare.
- **Nu umpli.** Dacă ai o singură propoziție bună, o scrii pe aceea. Trei
  propoziții mediocre nu sunt mai profesioniste decât una exactă.

## Variantele de răspuns

Uneori o întrebare are răspunsuri tipice, distincte, iar omului îi e mai ușor
să aleagă decât să formuleze — mai ales la începutul unei teme grele. Atunci
pui 3–5 variante scurte în \`options\`. Reguli:

- Fiecare variantă trebuie să spună altceva despre el. Nu două care înseamnă
  același lucru.
- Niciodată la întrebări care cer o poveste sau o scenă. Acolo variantele
  sărăcesc răspunsul.
- Când ghidul dă variante pentru pasul curent, pornește de la ele; le poți
  adapta la ce a spus omul.
- După ce omul alege o variantă, întrebarea următoare sapă în ea — nu treci la
  altceva.
- **Variantele răspund la întrebarea din \`reply\`, din același mesaj.** Dacă
  întrebarea ta cere o scenă („ce s-a întâmplat mai exact?"), \`options\` e
  goală. Variantele unui pas pe care nu l-ai deschis încă nu au ce căuta
  sub o altă întrebare — omul le vede și nu se leagă cu ce l-ai întrebat.

## Ghidul

Când conversația urmează un ghid, primești pasul curent: ce caută, ce variante
are, ce scheme pândește. Îl folosești ca busolă, nu ca scenariu. Întrebarea o
scrii tu, legată de ce a spus omul mai devreme. Nu sări pași și nu anunți
„acum trecem la…". Când pasul și-a făcut treaba — omul a răspuns pe fond, nu
tangențial — pui \`advance_step\` pe adevărat, iar următoarea ta replică va
deschide pasul următor. Dacă mai e ceva de săpat, rămâi.

Schemele din ghid sunt pentru tine, nu pentru el. Nu le numi niciodată.

## Ce NU faci

Nu reciți harta. Nu enumeri ce ai observat. Nu spui „am adăugat o convingere".
Harta se vede singură, pe ecran, lângă tine.

Nu dai sfaturi și nu propui exerciții. Lucrul de transformare are locul lui.

## Siguranță

safety_flag este „crisis" numai la risc real: ideație suicidară, autovătămare,
abuz în desfășurare. „distress" pentru suferință intensă fără risc imediat. În
rest „none". Nu schimba tonul din cauza flagului — de restul se ocupă interfața.`;

/**
 * Rezumatul hărții pentru conversație: doar etichete, grupate pe ramuri.
 * Fără id-uri, fără rezumate, fără citate — acelea sunt treaba extracției.
 */
function compactMap(nodes: MindNode[]): string {
  const visible = nodes.filter((n) => n.verdict !== "rejected" && isFormed(n));
  // Ipotezele nevăzute: modelul le știe ca să le verifice, nu ca să le spună.
  const forming = nodes.filter((n) => n.verdict !== "rejected" && !isFormed(n));
  const formingSection =
    forming.length > 0
      ? "## Ipoteze în formare — nu i le spui; caută momentele în care revin " +
        "sau nu\n" +
        forming.map((n) => `- ${displayLabel(n)}`).join("\n")
      : "";

  if (visible.length === 0) {
    return [
      "## Harta este goală\n\nPrima conversație. Nu știi încă nimic sigur despre el.",
      formingSection,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  const grouped = new Map<LifeDomain, string[]>();
  for (const node of visible) {
    const mark =
      node.verdict === "confirmed" || node.verdict === "edited" ? "✓ " : "";
    const list = grouped.get(node.domain) ?? [];
    list.push(`${mark}${displayLabel(node)}`);
    grouped.set(node.domain, list);
  }

  const explored = [...grouped.entries()]
    .map(
      ([domain, labels]) =>
        `**${DOMAIN_LABELS[domain]}**: ${labels.join("; ")}`,
    )
    .join("\n");

  const untouched = EXPLORABLE_DOMAINS.filter((d) => !grouped.has(d));

  return [
    "## Ce știi deja despre el",
    "Nu-l întreba ce ți-a spus deja. Semnul ✓ înseamnă că el a confirmat.",
    explored,
    untouched.length > 0
      ? `**Domenii neatinse:** ${untouched.map((d) => DOMAIN_LABELS[d]).join(", ")}.`
      : "",
    formingSection,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Busola: unde e conversația în ghid și ce caută pasul de acum. */
function guideBrief(
  guide: Guide,
  stepIndex: number,
  turnsOnStep: number,
): string {
  const step: GuideStep | undefined = guide.steps[stepIndex];
  const next: GuideStep | undefined = guide.steps[stepIndex + 1];
  // Câte replici poate ține un pas. Aceeași valoare o impune și serverul.
  const maxTurnsPerStep = guide.turnsPerStep ?? DEFAULT_TURNS_PER_STEP;
  const mustAdvance = turnsOnStep + 1 >= maxTurnsPerStep;
  // Lecția cu încheiere proprie (introducerea) se termină cum spune ea.
  const closing =
    guide.closing ??
    "**Aceasta este ultima replică a lecției.** Pune advance_step pe adevărat și " +
      "încheie: două-trei propoziții cu ce ai auzit de la el, în cuvintele lui, " +
      "legate între ele — nu diagnostic, nu sfat, nu întrebare nouă. Spune-i că " +
      "harta lui se actualizează acum cu ce a povestit. options goală.";

  if (!step) {
    return (
      `## Ghid: ${guide.title}\n\n` +
      "Toți pașii au fost parcurși. Încheie natural: o întrebare de închidere " +
      "despre ce i-a rămas din discuție, sau lasă-l pe el să spună ce vrea. " +
      "Pune advance_step pe fals."
    );
  }

  const schemas = step.schemas
    .map((code) => SCHEMA_BY_CODE.get(code))
    .filter(Boolean)
    .map((s) => `${s!.name} — ${s!.essence}`)
    .join("\n  - ");

  return [
    `## Ghid: ${guide.title}`,
    guide.brief ?? "",
    `Pasul ${stepIndex + 1} din ${guide.steps.length}.`,
    `**Întrebarea de pornire a pasului:** ${step.question}`,
    step.options ? `**Variante sugerate:** ${step.options.join(" · ")}` : "",
    `**Ce caută pasul:** ${step.lookingFor}`,
    schemas ? `**Scheme pândite (nu le numi):**\n  - ${schemas}` : "",
    stepIndex === 0 && turnsOnStep === 0
      ? "Este primul pas: omul a răspuns deja la întrebarea de deschidere. Sapă în răspuns."
      : "",
    `**Replici petrecute pe acest pas:** ${turnsOnStep}. Un pas ține cel mult ` +
      `${maxTurnsPerStep} replici: ` +
      (maxTurnsPerStep > 2
        ? "o întrebare de adâncire, apoi una care cere al doilea moment al aceleiași " +
          "reguli („s-a mai întâmplat și altă dată?”), apoi mai departe."
        : "o singură întrebare de adâncire, apoi mai departe."),
    // Ultimul pas nu deschide nimic: încheie lecția, cu o concluzie și fără
    // întrebare. O lecție care se termină cu o întrebare nu se termină.
    !next && mustAdvance
      ? closing
      : !next
        ? "Dacă omul a răspuns pe fond, pune advance_step pe adevărat și încheie " +
          "lecția chiar în această replică, așa: " +
          closing +
          " Dacă mai e de săpat, o singură întrebare, apoi încheierea vine oricum " +
          "la următoarea."
        : mustAdvance
          ? "**Aceasta este ultima replică pe acest pas.** Pune advance_step pe adevărat " +
            "și încheie pasul cu întrebarea care deschide următorul — nu mai săpa aici."
          : "Dacă omul a răspuns pe fond, pune advance_step pe adevărat și deschide pasul " +
            "următor chiar în această replică.",
    next
      ? "**Cum treci la pasul următor:** o propoziție care leagă ce a spus de noua " +
        "temă, apoi întrebarea. Nu anunța trecerea („hai să trecem altundeva”, " +
        "„să mergem mai departe”): omul o simte ca pe un chestionar.\n" +
        `**Pasul următor:** ${next.question}` +
        (next.options
          ? `\n  Variantele lui: ${next.options.join(" · ")}. Le pui în \`options\` ` +
            "**numai** în replica în care advance_step e adevărat și întrebarea din " +
            "reply este chiar această întrebare. Sub o întrebare de adâncire pe pasul " +
            "curent, options rămâne goală."
          : "\n  Nu are variante: e o întrebare care cere o poveste.")
      : "**Nu mai există pas următor:** după acesta, încheie natural.",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeOption(option: string): string {
  return option
    .trim()
    .toLowerCase()
    .replace(/[.!?…]+$/, "");
}

/** Câte dintre `options` se regăsesc, ca text, în setul `pool`. */
function overlap(options: string[], pool: string[] | undefined): number {
  if (!pool) return 0;
  const set = new Set(pool.map(normalizeOption));
  return options.filter((o) => set.has(normalizeOption(o))).length;
}

/**
 * Modelul primește variantele pasului curent și ale celui următor ca reper,
 * și uneori le copiază sub o întrebare la care nu se potrivesc: pune o
 * întrebare de adâncire despre tată și oferă dedesubt „Note și rezultate ·
 * Că ajutam…”, variantele pasului despre laude. Omul vede butoane care nu au
 * legătură cu ce a fost întrebat.
 *
 * Regula: variantele pasului următor sunt legitime doar când replica îl
 * deschide (advance). Variantele pasului curent sunt legitime doar la
 * deschiderea lui — adică în replica anterioară, nu în cele de adâncire.
 * Restul se aruncă; omul scrie liber, ceea ce oricând e mai bine decât
 * butoane greșite.
 */
export function sanitizeOptions(
  options: string[],
  guideId: string | null | undefined,
  stepIndex: number,
  advancing: boolean,
): string[] {
  if (options.length === 0 || !guideId) return options;
  const guide = getGuide(guideId);
  if (!guide) return options;

  const current = guide.steps[stepIndex];
  const next = guide.steps[stepIndex + 1];
  const threshold = Math.max(2, Math.ceil(options.length / 2));

  if (!advancing && overlap(options, next?.options) >= threshold) return [];
  if (overlap(options, current?.options) >= threshold) return [];
  return options;
}

export interface ReplyInput {
  nodes: MindNode[];
  history: Array<{ role: "user" | "assistant"; content: string }>;
  message: string;
  guideId?: string | null;
  stepIndex?: number;
  /** Câte replici s-au petrecut deja pe pasul curent. */
  turnsOnStep?: number;
}

export const REPLY_MODEL = MODELS.reply;

interface Metered {
  usage: TokenUsage;
  /** Modelul care a răspuns: introducerea merge pe cel ieftin. */
  model: string;
}

export type ReplyResult = Metered &
  (
    | { ok: true; reply: Reply }
    | { ok: false; reply: string; safety: "crisis" | "none" }
  );

export async function runReply(input: ReplyInput): Promise<ReplyResult> {
  const guide = input.guideId ? getGuide(input.guideId) : null;

  const system: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: INSTRUCTIONS,
      // Identic la fiecare cerere: rămâne în cache și nu se replătește.
      cache_control: { type: "ephemeral" },
    },
    { type: "text", text: compactMap(input.nodes) },
  ];

  if (guide) {
    system.push({
      type: "text",
      text: guideBrief(guide, input.stepIndex ?? 0, input.turnsOnStep ?? 0),
    });
  }

  // Lecția introductivă e gratuită: merge pe modelul ieftin.
  const model = guide?.free ? MODELS.replyIntro : MODELS.reply;
  const { thinking, effort } = reasoningFor(
    model,
    guide?.free ? EFFORT.replyIntro : EFFORT.reply,
  );

  const response = await anthropic().messages.parse({
    model,
    max_tokens: 2000,
    ...(thinking ? { thinking } : {}),
    output_config: {
      ...(effort ? { effort } : {}),
      format: zodOutputFormat(ReplySchema),
    },
    system,
    messages: [
      ...input.history.slice(-HISTORY_TURNS).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user" as const, content: input.message },
    ],
  });

  const usage = readUsage(response.usage);

  if (response.stop_reason === "refusal") {
    return {
      ok: false,
      usage,
      model,
      safety: "crisis",
      reply:
        "Nu pot continua pe firul acesta. Dacă treci printr-un moment greu, " +
        "vorbește cu cineva în care ai încredere sau sună la 0800 801 200 " +
        "(Antisuicid, gratuit, non-stop).",
    };
  }

  if (!response.parsed_output) {
    return {
      ok: false,
      usage,
      model,
      safety: "none",
      reply: "Nu am prins ce ai spus. Poți să reiei?",
    };
  }

  return { ok: true, usage, model, reply: response.parsed_output };
}
