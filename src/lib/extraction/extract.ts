import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import type { MindNode } from "@/lib/types";
import { ExtractionSchema, type Extraction } from "./schema";
import { SYSTEM_INSTRUCTIONS, buildGraphIndex } from "./prompt";

/**
 * Munca grea: ce este convingere, ce se unește cu ce, ce se leagă de ce.
 *
 * Rulează rar — o dată la câteva replici și la închiderea conversației — pe
 * mai multe mesaje odată. Costul indexului complet se împarte astfel la toate
 * replicile din bucată, în loc să fie plătit de fiecare.
 */

const MODEL = "claude-opus-5";

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export interface ExtractionInput {
  nodes: MindNode[];
  /** Bucata de conversație neprelucrată încă, în ordine cronologică. */
  exchanges: Array<{ role: "user" | "assistant"; content: string }>;
}

export type ExtractionResult =
  | { ok: true; extraction: Extraction }
  | { ok: false; reason: "refusal" | "unparsable" };

const EMPTY: Extraction = { new_nodes: [], node_updates: [], new_edges: [] };

export async function runExtraction(input: ExtractionInput): Promise<ExtractionResult> {
  if (input.exchanges.length === 0) {
    return { ok: true, extraction: EMPTY };
  }

  const transcript = input.exchanges
    .map((m) => `${m.role === "user" ? "EL" : "TU"}: ${m.content}`)
    .join("\n\n");

  const response = await anthropic().messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: SYSTEM_INSTRUCTIONS,
        // Identic la fiecare rulare: rămâne în cache și nu se replătește.
        cache_control: { type: "ephemeral" },
      },
      {
        // Indexul se schimbă pe măsură ce harta crește, deci stă după breakpoint.
        type: "text",
        text: buildGraphIndex(input.nodes),
      },
    ],
    messages: [
      {
        role: "user",
        content:
          "Bucata de conversație de prelucrat. Extrage doar din replicile lui " +
          `(marcate „EL”), nu din ale interlocutorului.\n\n${transcript}`,
      },
    ],
    output_config: { format: zodOutputFormat(ExtractionSchema) },
  });

  if (response.stop_reason === "refusal") {
    return { ok: false, reason: "refusal" };
  }

  if (!response.parsed_output) {
    return { ok: false, reason: "unparsable" };
  }

  return { ok: true, extraction: response.parsed_output };
}
