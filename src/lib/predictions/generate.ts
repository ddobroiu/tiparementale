import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";

import { readUsage, type TokenUsage } from "@/lib/billing/pricing";
import { EFFORT, MODELS, reasoningFor } from "@/lib/models";
import { DOMAIN_LABELS, displayLabel, type MindNode } from "@/lib/types";

/**
 * Predicții de comportament, derivate din convingerile confirmate.
 *
 * Este momentul în care produsul dovedește că a înțeles ceva: nu îi spune
 * omului ce crede, ci ce probabil face — într-o situație atât de concretă
 * încât răspunsul să fie „da, exact” sau „nu, deloc”, niciodată „poate”.
 *
 * Un „nu” valorează mai mult decât zece extracții reușite: e singurul semnal
 * care spune că am dedus greșit din ceva ce omul confirmase.
 */

export const PREDICTION_MODEL = MODELS.prediction;

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

const PredictionSchema = z.object({
  node_id: z.string().describe("id-ul convingerii confirmate din care decurge."),
  situation: z
    .string()
    .describe(
      "Situația concretă, la persoana a doua, scurtă. „Când cineva îți oferă " +
        "ajutor la ceva ce faci singur de o oră”.",
    ),
  behaviour: z
    .string()
    .describe(
      "Ce faci probabil, formulat observabil. „Spui «mă descurc» înainte să " +
        "apuci să te gândești dacă vrei ajutorul”.",
    ),
  rationale: z
    .string()
    .describe("O propoziție: din ce convingere decurge și de ce."),
});

export const PredictionsSchema = z.object({
  predictions: z.array(PredictionSchema),
});

export type GeneratedPrediction = z.infer<typeof PredictionSchema>;

const INSTRUCTIONS = `Primești convingeri pe care un om le-a confirmat despre
sine. Scrii predicții de comportament: situații concrete în care el probabil
reacționează într-un anume fel, ca urmare a acelor convingeri.

Scopul este ca omul să citească și să spună „da, exact așa fac” — sau „nu, nu
sunt eu”. Ambele răspunsuri sunt utile. Ce nu e util e „poate, depinde”.

## Reguli

- **Situația trebuie să fie un moment, nu o temă.** Nu „în relații”, ci „când
  cineva îți răspunde la mesaj după șase ore”. Cu cât e mai concretă, cu atât
  răspunsul e mai clar.
- **Comportamentul trebuie să fie observabil.** Ceva ce ar vedea o cameră de
  filmat sau ceva ce omul își amintește că a făcut. Nu „te simți nesigur”, ci
  „recitești mesajul de trei ori înainte să-l trimiți”.
- **Prezice ce face, nu ce simte.** Sentimentele sunt greu de contrazis, deci
  răspunsul devine vag și nu învățăm nimic.
- **Fii specific până la punctul în care ai putea greși.** O predicție care nu
  poate fi infirmată nu spune nimic. Riscă.
- **Nu flata și nu judeca.** Fără „ești un om care ține mult la ceilalți”, fără
  „te sabotezi”. Doar ce se întâmplă.
- **Nu repeta convingerea cu alte cuvinte.** Dacă predicția e o parafrază, nu
  e o predicție. Trebuie să adauge o situație pe care omul nu a menționat-o.
- **Cel mult una pe convingere**, și maximum cinci în total. Alege convingerile
  cu încrederea cea mai mare.
- Vorbești cu el, la persoana a doua, scurt și fără jargon.`;

export interface PredictionInput {
  nodes: MindNode[];
}

export interface PredictionOutcome {
  predictions: GeneratedPrediction[];
  usage: TokenUsage;
}

export async function generatePredictions(
  input: PredictionInput,
): Promise<PredictionOutcome> {
  const empty: TokenUsage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_tokens: 0,
    cache_write_tokens: 0,
  };

  if (input.nodes.length === 0) return { predictions: [], usage: empty };

  const context = input.nodes
    .map(
      (n) =>
        `[${n.id}] (${DOMAIN_LABELS[n.domain]}, încredere ${n.confidence.toFixed(2)}) ` +
        `„${displayLabel(n)}”${n.summary ? ` — ${n.summary}` : ""}`,
    )
    .join("\n");

  const { thinking, effort } = reasoningFor(MODELS.prediction, EFFORT.prediction);

  const response = await anthropic().messages.parse({
    model: MODELS.prediction,
    max_tokens: 8000,
    ...(thinking ? { thinking } : {}),
    system: [
      { type: "text", text: INSTRUCTIONS, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content: `Convingeri confirmate de el:\n\n${context}`,
      },
    ],
    output_config: {
      ...(effort ? { effort } : {}),
      format: zodOutputFormat(PredictionsSchema),
    },
  });

  const usage = readUsage(response.usage);

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return { predictions: [], usage };
  }

  // Un id inventat de model nu are ce căuta în bază.
  const known = new Set(input.nodes.map((n) => n.id));
  const predictions = response.parsed_output.predictions.filter((p) =>
    known.has(p.node_id),
  );

  return { predictions, usage };
}
