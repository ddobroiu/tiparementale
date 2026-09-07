import * as z from "zod/v4";

/**
 * Două ieșiri structurate, pentru două meserii diferite.
 *
 * `ReplySchema` este calea fierbinte: se cere la fiecare replică, deci trebuie
 * să fie mică. `ExtractionSchema` rulează rar, pe mai multe mesaje odată, și
 * își permite să fie bogată.
 *
 * Fără câmpuri opționale — structured outputs cere scheme stricte, deci
 * absența se exprimă prin `null`, nu prin lipsa cheii.
 */

export const NodeTypeEnum = z.enum([
  "belief",
  "value",
  "emotion",
  "goal",
  "pattern",
  "fear",
  "relationship",
]);

/** Ramura din hartă de care aparține elementul. */
export const DomainEnum = z.enum([
  "money",
  "relationships",
  "health",
  "work",
  "family",
  "self",
  "meaning",
  "other",
]);

export const SafetyEnum = z
  .enum(["none", "distress", "crisis"])
  .describe(
    "„distress” pentru suferință intensă; „crisis” doar pentru risc de " +
      "autovătămare, ideație suicidară sau abuz în desfășurare.",
  );

// ---------------------------------------------------------------- conversație

export const ReplySchema = z.object({
  reply: z
    .string()
    .describe(
      "Replica ta: două-trei propoziții, apoi o singură întrebare. Caldă, " +
        "curioasă, în limbajul lui. Fără jargon, fără sfaturi, fără să reciți harta.",
    ),
  domain_in_focus: DomainEnum.describe("Domeniul pe care îl explorezi acum."),
  safety_flag: SafetyEnum,
});

export type Reply = z.infer<typeof ReplySchema>;

// ---------------------------------------------------------------- extracție

/** Unitatea atomică de adevăr: ce s-a observat și din ce cuvinte anume. */
export const ObservationSchema = z.object({
  quote: z
    .string()
    .describe(
      "Citat exact din ce a spus el, cuvânt cu cuvânt. Nu parafraza. " +
        "Acesta este răspunsul la întrebarea „de unde știi asta despre mine?”.",
    ),
  sentiment: z
    .string()
    .nullable()
    .describe("Un singur cuvânt pentru tonul emoțional, sau null."),
  valence: z.number().describe("De la -1 (foarte negativ) la 1 (foarte pozitiv)."),
});

export const NewNodeSchema = z.object({
  temp_id: z
    .string()
    .describe("Identificator local, folosit pentru a lega muchii de acest nod nou."),
  type: NodeTypeEnum,
  domain: DomainEnum.describe(
    "Domeniul de viață de care ține. Folosește „other” doar când chiar nu se " +
      "potrivește niciunul.",
  ),
  label: z
    .string()
    .describe(
      "Formularea nodului, scurtă, la persoana întâi, în limbajul lui. " +
        "De exemplu: „Trebuie să fiu perfect ca să merit”.",
    ),
  summary: z.string().describe("O propoziție care explică nodul."),
  confidence: z.number().describe("De la 0 la 1. O singură mențiune rareori trece de 0.5."),
  observation: ObservationSchema,
});

export const NodeUpdateSchema = z.object({
  node_id: z.string().describe("id-ul unui nod existent din index."),
  observation: ObservationSchema,
  confidence_delta: z
    .number()
    .describe(
      "Cât se schimbă încrederea, de la -0.3 la 0.3. Pozitiv dacă tiparul se " +
        "confirmă, negativ dacă mesajul îl contrazice.",
    ),
  summary: z
    .string()
    .nullable()
    .describe("Rezumat înlocuitor, dacă înțelegerea s-a rafinat. Altfel null."),
});

export const NewEdgeSchema = z.object({
  from: z.string().describe("id de nod existent sau temp_id dintre nodurile noi."),
  to: z.string().describe("id de nod existent sau temp_id dintre nodurile noi."),
  relation: z
    .string()
    .describe(
      "Relația, în română, 1–3 cuvinte. De exemplu: „alimentează”, „intră în " +
        "conflict cu”, „protejează”, „provine din”.",
    ),
  strength: z.number().describe("De la 0 la 1."),
  rationale: z.string().describe("De ce există această legătură."),
});

export const ExtractionSchema = z.object({
  new_nodes: z.array(NewNodeSchema),
  node_updates: z.array(NodeUpdateSchema),
  new_edges: z.array(NewEdgeSchema),
});

export type Extraction = z.infer<typeof ExtractionSchema>;
export type ExtractedObservation = z.infer<typeof ObservationSchema>;
