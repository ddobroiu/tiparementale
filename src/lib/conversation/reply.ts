import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import type { LifeDomain, MindNode } from "@/lib/types";
import { DOMAIN_LABELS, EXPLORABLE_DOMAINS, displayLabel } from "@/lib/types";
import { ReplySchema, type Reply } from "@/lib/extraction/schema";
import { readUsage, type TokenUsage } from "@/lib/billing/pricing";
import { MODELS, reasoningFor } from "@/lib/models";

/**
 * Calea fierbinte: replica din conversație, cerută de zeci de ori pe sesiune.
 *
 * Aici nu se face extracție. A purta conversația și a decide dacă o afirmație
 * nouă se unește cu un nod existent sunt două meserii de dificultăți diferite;
 * ținute împreună, fiecare „și ce s-a întâmplat apoi?" plătea indexul complet
 * al hărții și o rundă de raționament greu.
 *
 * Modelul primește doar un rezumat compact al hărții — suficient cât să nu
 * întrebe ce știe deja — și răspunde scurt.
 */

const HISTORY_TURNS = 12;

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

const INSTRUCTIONS = `Ești interlocutorul din Tipare Mentale.

Porți o conversație adevărată cu omul din fața ta — despre bani, relații,
sănătate, muncă, familie, felul în care se vede pe sine, sensul pe care îl caută.
Din ce spune el se construiește, separat de tine, o hartă a convingerilor care
îi conduc viața. Tu ai o singură sarcină: să porți conversația bine.

## Cum vorbești

Ești curios, cald și direct. Pui întrebări. Asculți răspunsul și mergi mai adânc
în el, nu treci la următoarea temă de pe listă. O conversație bună are un fir,
nu un chestionar.

- **O singură întrebare pe replică.** Două întrebări puse odată primesc mereu
  răspuns doar la a doua.
- **Sapi înainte să lărgești.** Când cineva spune „mereu îmi fac griji pentru
  bani", întrebarea bună nu este despre sănătate, ci „de când?" sau „ce se
  întâmplă în capul tău exact în momentul ăla?".
- **Ceri exemple concrete.** „Ultima dată când s-a întâmplat, ce a fost?"
  Convingerile ies la iveală din întâmplări, nu din generalități.
- **Reflectezi în cuvintele lui**, nu în ale tale. Fără jargon psihologic, fără
  etichete de manual, fără „se pare că ai un tipar de evitare".
- **Nu consolezi automat.** „Înțeleg cât de greu trebuie să fie" nu ajută pe
  nimeni. O întrebare bună arată mai multă atenție decât o mângâiere.
- Scurt. Două-trei propoziții, apoi întrebarea.

## Ce NU faci

Nu reciți harta. Nu enumeri ce ai observat. Nu spui „am adăugat o convingere
nouă". Harta se vede singură, pe ecran, lângă tine — dacă o povestești, devine
de prisos, iar conversația se transformă în raport.

Nu dai sfaturi și nu propui exerciții. Lucrul de transformare are locul lui,
pornit de om atunci când confirmă o convingere pe hartă.

## Domeniile

Când firul curent se închide natural, deschide un domeniu neexplorat — printr-o
întrebare, nu printr-un anunț. Niciodată „hai să vorbim acum despre sănătate",
ci o întrebare care duce acolo.

## Siguranță

safety_flag este „crisis" numai la risc real: ideație suicidară, autovătămare,
abuz în desfășurare. „distress" pentru suferință intensă fără risc imediat. În
rest „none". Nu schimba tonul din cauza flagului — de restul se ocupă interfața.`;

/**
 * Rezumatul hărții pentru conversație: doar etichete, grupate pe ramuri.
 * Fără id-uri, fără rezumate, fără citate — acelea sunt treaba extracției.
 */
function compactMap(nodes: MindNode[]): string {
  const visible = nodes.filter((n) => n.verdict !== "rejected");

  if (visible.length === 0) {
    return (
      "## Harta este goală\n\n" +
      "Prima conversație. Începe simplu: întreabă-l ce îl preocupă în ultima " +
      "vreme și urmează firul."
    );
  }

  const grouped = new Map<LifeDomain, string[]>();
  for (const node of visible) {
    const mark = node.verdict === "confirmed" || node.verdict === "edited" ? "✓ " : "";
    const list = grouped.get(node.domain) ?? [];
    list.push(`${mark}${displayLabel(node)}`);
    grouped.set(node.domain, list);
  }

  const explored = [...grouped.entries()]
    .map(([domain, labels]) => `**${DOMAIN_LABELS[domain]}**: ${labels.join("; ")}`)
    .join("\n");

  const untouched = EXPLORABLE_DOMAINS.filter((d) => !grouped.has(d));

  return [
    "## Ce știi deja despre el",
    "Nu-l întreba ce ți-a spus deja. Semnul ✓ înseamnă că el a confirmat.",
    explored,
    untouched.length > 0
      ? `**Domenii neatinse:** ${untouched.map((d) => DOMAIN_LABELS[d]).join(", ")}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export interface ReplyInput {
  nodes: MindNode[];
  history: Array<{ role: "user" | "assistant"; content: string }>;
  message: string;
}

export const REPLY_MODEL = MODELS.reply;

interface Metered {
  usage: TokenUsage;
}

export type ReplyResult = Metered &
  ({ ok: true; reply: Reply } | { ok: false; reply: string; safety: "crisis" | "none" });

export async function runReply(input: ReplyInput): Promise<ReplyResult> {
  // Gândire adaptivă la efort redus, acolo unde modelul o cunoaște: se oprește
  // să cântărească doar când chiar are de ales întrebarea, nu la fiecare „da,
  // înțeleg". Pe modelele care nu o cunosc, lipsește cu totul.
  const { thinking, effort } = reasoningFor(MODELS.reply, "low");

  const response = await anthropic().messages.parse({
    model: MODELS.reply,
    max_tokens: 2000,
    ...(thinking ? { thinking } : {}),
    output_config: {
      ...(effort ? { effort } : {}),
      format: zodOutputFormat(ReplySchema),
    },
    system: [
      {
        type: "text",
        text: INSTRUCTIONS,
        // Identic la fiecare cerere: rămâne în cache și nu se replătește.
        cache_control: { type: "ephemeral" },
      },
      { type: "text", text: compactMap(input.nodes) },
    ],
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
      safety: "none",
      reply: "Nu am prins ce ai spus. Poți să reiei?",
    };
  }

  return { ok: true, usage, reply: response.parsed_output };
}
