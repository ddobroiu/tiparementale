import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";

import { DOMAIN_LABELS, NODE_TYPE_LABELS, displayLabel } from "@/lib/types";
import type { MindNode, Observation } from "@/lib/types";
import { readUsage, type TokenUsage } from "@/lib/billing/pricing";

const MODEL = "claude-opus-5";

export const TRANSFORMATION_MODEL = MODEL;

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
    .array(SuggestionSchema)
    .describe("Două-trei exerciții mici, de făcut în aceeași zi. Nimic abstract."),
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
- **Exercițiile sunt mici și de făcut azi.** „Predă o sarcină la 90% și notează
  ce s-a întâmplat de fapt" — nu „lucrează la acceptarea de sine".
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

  const response = await anthropic().messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: INSTRUCTIONS,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: context }],
    output_config: { format: zodOutputFormat(TransformationSchema) },
  });

  const usage = readUsage(response.usage);

  if (response.stop_reason === "refusal") return { plan: null, usage };
  return { plan: response.parsed_output ?? null, usage };
}
