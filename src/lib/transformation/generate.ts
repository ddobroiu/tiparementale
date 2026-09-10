import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";

import { DOMAIN_LABELS, NODE_TYPE_LABELS, displayLabel } from "@/lib/types";
import type { MindNode, Observation } from "@/lib/types";
import { readUsage, type TokenUsage } from "@/lib/billing/pricing";
import { EFFORT, MODELS, reasoningFor } from "@/lib/models";

export const TRANSFORMATION_MODEL = MODELS.transformation;

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

// ---------------------------------------------------------------- schema

const SuggestionSchema = z.object({
  title: z.string().describe("Titlul, scurt și concret."),
  rationale: z
    .string()
    .describe("De ce anume aceasta, pentru convingerea aceasta. Două propoziții."),
});

/**
 * Exercițiul ca procedură, nu ca idee. Cele patru câmpuri urmează forma
 * experimentului comportamental: când, ce, ce notezi, când revii. Fără ele,
 * „predă ceva la 90%” rămâne o vorbă bună de care nu se apucă nimeni.
 */
const ExerciseSchema = z.object({
  title: z.string().describe("Titlul, ca o instrucțiune scurtă la persoana a doua."),
  method: z
    .enum([
      "behavioural_experiment",
      "graded_exposure",
      "thought_record",
      "opposite_action",
      "boundary_practice",
      "self_compassion",
    ])
    .describe(
      "Metoda: behavioural_experiment (testezi predicția convingerii într-o situație " +
        "reală), graded_exposure (pas mic spre ce eviți), thought_record (prinzi gândul " +
        "și îl separi de fapt), opposite_action (faci deliberat contrariul reflexului), " +
        "boundary_practice (spui nu / ceri, în miză mică), self_compassion (numești și " +
        "înlocuiești vocea critică).",
    ),
  trigger_cue: z
    .string()
    .describe(
      "Declanșatorul: momentul concret în care exercițiul se pornește. „Când observi " +
        "că recitești un e-mail a treia oară.” Nu „când te simți anxios”.",
    ),
  action: z
    .string()
    .describe(
      "Ce faci, exact, în sub zece minute. O singură acțiune, observabilă, pe care " +
        "o poți face azi. Nu „lucrează la…”, ci „trimite versiunea a doua”.",
    ),
  record_prompt: z
    .string()
    .describe(
      "Ce notezi imediat după, în două-trei rânduri. Fapte, nu sentimente: cine ce " +
        "a spus, ce consecință reală a avut, cât a durat disconfortul.",
    ),
  review_after_days: z
    .number()
    .describe("După câte zile revii să te uiți la ce ai notat. De regulă 3–7."),
  rationale: z
    .string()
    .describe("Ce testează exercițiul din convingerea veche, într-o propoziție."),
});

const WorkSchema = z.object({
  title: z.string(),
  creator: z.string().describe("Autorul, respectiv regizorul."),
  year: z.number().describe("Anul apariției."),
  rationale: z.string().describe("Ce anume din ea vorbește despre convingerea asta."),
});

export const TransformationSchema = z.object({
  new_belief: z
    .string()
    .describe(
      "Convingerea nouă, la persoana întâi, în limbajul lui. Nu opusul naiv al " +
        "celei vechi, ci varianta pe care ar putea-o crede cu adevărat.",
    ),
  why_old_persists: z
    .string()
    .describe(
      "De ce s-a instalat convingerea veche și ce a protejat la vremea ei. " +
        "Fără vinovăție: a fost o soluție, nu un defect.",
    ),
  rationale: z
    .string()
    .describe("De ce convingerea nouă este pasul realist de aici, nu un salt."),
  exercises: z
    .array(ExerciseSchema)
    .describe(
      "Două-trei exerciții, fiecare cu declanșator, acțiune sub zece minute, ce " +
        "notezi și când revii. Metode diferite între ele.",
    ),
  examples: z
    .array(SuggestionSchema)
    .describe(
      "Două-trei situații concrete din viața obișnuită în care convingerea nouă " +
        "se aplică, descrise atât de precis încât să fie de recunoscut.",
    ),
  book: WorkSchema.describe("O carte reală, cunoscută."),
  film: WorkSchema.describe("Un film real, cunoscut."),
});

export type TransformationPlan = z.infer<typeof TransformationSchema>;

// ---------------------------------------------------------------- prompt

const INSTRUCTIONS = `Lucrezi cu cineva la o convingere pe care el a confirmat-o
despre sine. Scopul nu este să-i explici că greșește, ci să-i dai o convingere
nouă pe care s-o poată crede, și pași concreți prin care s-o exerseze.

Reguli:

- **Convingerea nouă nu este opusul celei vechi.** „Nu trebuie să fiu perfect"
  este o negație, nu o convingere; nimeni nu trăiește după o negație. Caută
  varianta pe care ar putea-o crede *de mâine*: „Pot preda ceva bun fără să fie
  impecabil, și tot rămân în picioare."
- **Spune de ce s-a instalat cea veche și ce a protejat.** Convingerile
  restrictive au fost, aproape întotdeauna, soluții bune la un moment dat.
  Omul trebuie să vadă asta, altfel se apără de tine.
- **Exercițiile sunt proceduri, nu idei.** Un tipar nu se repară cu motivație,
  se reconstruiește cu structură. Fiecare exercițiu are patru părți: *când* se
  pornește (un declanșator concret, observabil — nu o stare), *ce* faci în sub
  zece minute (o singură acțiune), *ce notezi* imediat după (fapte: cine ce a
  spus, ce consecință reală a avut, cât a durat disconfortul) și *după câte
  zile* revii la ce ai notat. Notarea nu e opțională: fără ea, mintea rescrie
  ce s-a întâmplat ca să se potrivească cu regula veche.
- **Metode diferite între exerciții.** Un experiment comportamental testează
  predicția convingerii; un pas mic expune gradual la ce e evitat; contrariul
  reflexului rupe automatismul; graniță înseamnă a spune nu sau a cere, în
  miză mică; vocea înseamnă a numi sursa criticului interior. Alege metoda
  după convingere, nu la întâmplare, și nu repeta aceeași metodă de trei ori.
- **Declanșatorul e cheia.** „Când te simți anxios" nu se poate observa; „când
  recitești un e-mail a treia oară" da. Exercițiul care nu are un moment clar
  de pornire nu se face niciodată.
- **Exemplele sunt situații, nu principii.** Descrie momentul concret în care
  convingerea nouă se aplică, ca omul să-l recunoască atunci când apare.
- **Cartea și filmul trebuie să existe cu adevărat** și să fie cunoscute. Dă
  autorul sau regizorul și anul. Dacă nu ești sigur că o operă există exact așa,
  alege alta despre care ești sigur. Motivația se leagă de convingerea asta
  anume, nu de temă în general.
- Vorbești cu el, nu despre el. La persoana a doua, cald și fără jargon.`;

export interface TransformationInput {
  node: MindNode;
  observations: Observation[];
  relatedLabels: string[];
}

export interface TransformationOutcome {
  plan: TransformationPlan | null;
  usage: TokenUsage;
}

export async function generateTransformation(
  input: TransformationInput,
): Promise<TransformationOutcome> {
  const { node, observations, relatedLabels } = input;

  const quotes = observations
    .slice(0, 12)
    .map((o) => `- „${o.quote}"`)
    .join("\n");

  const context = [
    `Convingerea confirmată: „${displayLabel(node)}"`,
    `Tip: ${NODE_TYPE_LABELS[node.type]} · Domeniu: ${DOMAIN_LABELS[node.domain]}`,
    node.summary ? `Rezumat: ${node.summary}` : null,
    "",
    "Cuvintele lui, din care a fost dedusă:",
    quotes || "- (nu există citate)",
    relatedLabels.length > 0
      ? `\nLegată în hartă de: ${relatedLabels.map((l) => `„${l}"`).join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { thinking, effort } = reasoningFor(MODELS.transformation, EFFORT.transformation);

  const response = await anthropic().messages.parse({
    model: MODELS.transformation,
    max_tokens: 16000,
    ...(thinking ? { thinking } : {}),
    system: [
      {
        type: "text",
        text: INSTRUCTIONS,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: context }],
    output_config: {
      ...(effort ? { effort } : {}),
      format: zodOutputFormat(TransformationSchema),
    },
  });

  const usage = readUsage(response.usage);

  if (response.stop_reason === "refusal") return { plan: null, usage };
  return { plan: response.parsed_output ?? null, usage };
}
