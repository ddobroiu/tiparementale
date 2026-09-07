import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import type { MindNode } from "@/lib/types";
import { ExtractionSchema, type Extraction } from "./schema";
import { SYSTEM_INSTRUCTIONS, buildGraphIndex } from "./prompt";

const MODEL = "claude-opus-5";

/** Câte replici anterioare intră în context. Harta poartă memoria lungă. */
const HISTORY_TURNS = 10;

let client: Anthropic | null = null;

/** Inițializare leneșă: cheia nu trebuie să existe la build, doar la rulare. */
function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export interface ExtractionInput {
  nodes: MindNode[];
  history: Array<{ role: "user" | "assistant"; content: string }>;
  message: string;
}

export type ExtractionResult =
  | { ok: true; extraction: Extraction }
  | { ok: false; reason: "refusal" | "unparsable"; reply: string };

/** Răspuns de rezervă când modelul nu produce o extracție utilizabilă. */
const FALLBACK_REPLY =
  "Am auzit ce mi-ai spus, dar nu am reușit să prelucrez mesajul acum. " +
  "Vrei să încerci din nou, poate cu alte cuvinte?";

export async function runExtraction(input: ExtractionInput): Promise<ExtractionResult> {
  const response = await anthropic().messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: SYSTEM_INSTRUCTIONS,
        // Identic la fiecare cerere: rămâne în cache și nu se replătește.
        cache_control: { type: "ephemeral" },
      },
      {
        // Indexul se schimbă pe măsură ce harta crește, deci stă după breakpoint.
        type: "text",
        text: buildGraphIndex(input.nodes),
      },
    ],
    messages: [
      ...input.history.slice(-HISTORY_TURNS).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user" as const, content: input.message },
    ],
    output_config: {
      format: zodOutputFormat(ExtractionSchema),
    },
  });

  if (response.stop_reason === "refusal") {
    return {
      ok: false,
      reason: "refusal",
      reply:
        "Nu pot continua pe firul acesta. Dacă treci printr-un moment greu, " +
        "vorbește cu cineva în care ai încredere sau sună la 0800 801 200 " +
        "(Antisuicid, gratuit, non-stop).",
    };
  }

  if (!response.parsed_output) {
    return { ok: false, reason: "unparsable", reply: FALLBACK_REPLY };
  }

  return { ok: true, extraction: response.parsed_output };
}
