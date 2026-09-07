import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";

import { readUsage, type TokenUsage } from "@/lib/billing/pricing";
import { EFFORT, MODELS, reasoningFor } from "@/lib/models";
import {
  DOMAIN_LABELS,
  EXPLORABLE_DOMAINS,
  NODE_TYPE_LABELS,
  displayLabel,
  type Edge,
  type MindNode,
} from "@/lib/types";

/**
 * Citirea hărții: ce spun elementele luate împreună.
 *
 * Fiecare nod în parte e o observație. Valoarea apare când se pun laolaltă —
 * aceeași regulă care explică amânarea la muncă explică și tăcerea într-o
 * relație. Asta nu se vede din noduri, ci din structura dintre ele, și de
 * aceea e nevoie de o privire peste tot deodată.
 */

export const READING_MODEL = MODELS.transformation;

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

const ThemeSchema = z.object({
  title: z
    .string()
    .describe("Numele temei, scurt, în cuvintele lui. Nu o etichetă de manual."),
  explanation: z
    .string()
    .describe(
      "Două-trei propoziții: ce leagă elementele acestea între ele și cum se " +
        "manifestă în viața lui, concret.",
    ),
  node_ids: z.array(z.string()).describe("id-urile elementelor care compun tema."),
});

export const ReadingSchema = z.object({
  summary: z
    .string()
    .describe(
      "Un paragraf de ansamblu, la persoana a doua. Ce se vede când privești " +
        "toată harta odată. Fără flatare și fără verdicte despre caracterul lui.",
    ),
  themes: z.array(ThemeSchema).describe("Două până la patru teme. Nu mai multe."),
  tension: z
    .string()
    .describe(
      "Contradicția centrală: două lucruri pe care le vrea și care se " +
        "împiedică unul pe altul. Dacă harta nu arată niciuna, spune asta.",
    ),
  blind_spot: z
    .string()
    .describe(
      "Ce nu apare în hartă și ar fi de așteptat să apară — o zonă neatinsă " +
        "sau un subiect ocolit. Formulat ca observație, nu ca reproș.",
    ),
});

export type Reading = z.infer<typeof ReadingSchema>;

const INSTRUCTIONS = `Citești harta mentală a unui om — convingerile, valorile,
temerile, tiparele și legăturile dintre ele — și scrii ce se vede când o
privești în întregime.

Nu rezuma elementele unul câte unul. Omul le are deja în față. Ce nu are este
structura: ce se repetă între zone care par fără legătură, ce regulă apare în
trei locuri sub trei forme, ce se contrazice.

## Reguli

- **Vorbește cu el, la persoana a doua.** Cald, direct, fără jargon.
- **Fără flatare.** „Ești un om profund” nu spune nimic și scade încrederea în
  tot restul. La fel, fără diagnostic și fără verdicte despre caracter.
- **Leagă zone diferite.** Cea mai valoroasă observație e de forma „aceeași
  regulă care te face să nu ceri mărire te face și să nu ceri ajutor acasă”.
- **Rămâi la ce e pe hartă.** Nu inventa istorie personală și nu deduce traume.
  Dacă ceva nu apare în date, nu apare nici în citire.
- **Numește contradicția, dacă există.** Nu ca problemă de rezolvat, ci ca
  observație: ce vrea și ce își interzice în același timp.
- **Punctul orb se formulează ca observație, nu ca reproș.** „Despre sănătate
  nu ai vorbit deloc” — nu „ignori sănătatea”.
- Dacă harta e prea mică pentru concluzii, spune asta simplu, în loc să
  fabrici semnificații.`;

export interface ReadingInput {
  nodes: MindNode[];
  edges: Edge[];
  previous: { summary: string; created_at: string } | null;
}

export interface ReadingOutcome {
  reading: Reading | null;
  usage: TokenUsage;
}

export async function generateReading(input: ReadingInput): Promise<ReadingOutcome> {
  const empty: TokenUsage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_tokens: 0,
    cache_write_tokens: 0,
  };

  if (input.nodes.length === 0) return { reading: null, usage: empty };

  const byId = new Map(input.nodes.map((n) => [n.id, n]));

  const nodeLines = input.nodes
    .map((n) => {
      const verdict =
        n.verdict === "confirmed" || n.verdict === "edited"
          ? "confirmat de el"
          : "neconfirmat";
      return (
        `[${n.id}] ${NODE_TYPE_LABELS[n.type]} · ${DOMAIN_LABELS[n.domain]} · ` +
        `încredere ${n.confidence.toFixed(2)} · ${verdict}\n  „${displayLabel(n)}”` +
        (n.summary ? `\n  ${n.summary}` : "")
      );
    })
    .join("\n");

  const edgeLines = input.edges
    .map((e) => {
      const from = byId.get(e.from_node);
      const to = byId.get(e.to_node);
      if (!from || !to) return null;
      return `„${displayLabel(from)}” ${e.relation} „${displayLabel(to)}”`;
    })
    .filter(Boolean)
    .join("\n");

  const touched = new Set(input.nodes.map((n) => n.domain));
  const untouched = EXPLORABLE_DOMAINS.filter((d) => !touched.has(d));

  const context = [
    `## Elemente (${input.nodes.length})`,
    nodeLines,
    edgeLines ? `\n## Legături\n${edgeLines}` : "",
    untouched.length > 0
      ? `\n## Zone neatinse\n${untouched.map((d) => DOMAIN_LABELS[d]).join(", ")}`
      : "",
    input.previous
      ? `\n## Citirea anterioară, din ${new Date(input.previous.created_at).toLocaleDateString("ro-RO")}\n${input.previous.summary}\n\nDacă s-a schimbat ceva față de ea, spune ce.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const { thinking, effort } = reasoningFor(READING_MODEL, EFFORT.transformation);

  const response = await anthropic().messages.parse({
    model: READING_MODEL,
    max_tokens: 8000,
    ...(thinking ? { thinking } : {}),
    system: [
      { type: "text", text: INSTRUCTIONS, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: context }],
    output_config: {
      ...(effort ? { effort } : {}),
      format: zodOutputFormat(ReadingSchema),
    },
  });

  const usage = readUsage(response.usage);

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return { reading: null, usage };
  }

  // Id-uri inventate nu au ce căuta în temele afișate.
  const reading = response.parsed_output;
  reading.themes = reading.themes.map((theme) => ({
    ...theme,
    node_ids: theme.node_ids.filter((id) => byId.has(id)),
  }));

  return { reading, usage };
}
