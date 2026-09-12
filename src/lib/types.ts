export type NodeType =
  | "belief"
  | "value"
  | "emotion"
  | "goal"
  | "pattern"
  | "fear"
  | "relationship";

export type LifeDomain =
  | "money"
  | "relationships"
  | "health"
  | "work"
  | "family"
  | "children"
  | "self"
  | "meaning"
  | "other";

export type NodeVerdict = "unconfirmed" | "confirmed" | "rejected" | "edited";

export type InputMode = "text" | "voice";

export type RecommendationKind = "exercise" | "book" | "film" | "example";

export type RecommendationStatus =
  | "suggested"
  | "in_progress"
  | "done"
  | "dismissed"
  | "inaccurate";

export type TransformationStatus = "proposed" | "practicing" | "adopted" | "dismissed";

export type SafetyFlag = "none" | "distress" | "crisis";

/**
 * Unde e nodul în transformare: fără lucru, cu o convingere nouă în exersare,
 * sau rezolvat — convingerea nouă adoptată. Vine calculat din bază, cu harta.
 */
export type WorkStatus = "working" | "resolved";

/** Ce se poate transforma: valorile și obiectivele nu se „rezolvă”. */
export function isWorkable(node: Pick<MindNode, "type">): boolean {
  return (
    node.type === "belief" ||
    node.type === "fear" ||
    node.type === "pattern" ||
    node.type === "emotion"
  );
}

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  belief: "Convingere",
  value: "Valoare",
  emotion: "Emoție",
  goal: "Obiectiv",
  pattern: "Tipar",
  fear: "Temere",
  relationship: "Relație",
};

/** Ramurile hărții. Discuția se poartă pe o temă, nu la întâmplare. */
export const DOMAIN_LABELS: Record<LifeDomain, string> = {
  money: "Bani",
  relationships: "Relații",
  health: "Sănătate",
  work: "Muncă",
  family: "Familie",
  children: "Copii",
  self: "Sine",
  meaning: "Sens",
  other: "Altele",
};

export const DOMAIN_COLORS: Record<LifeDomain, string> = {
  money: "#f6d186",
  relationships: "#ffb4a2",
  health: "#a0e7c4",
  work: "#a2d6f9",
  family: "#d8a0c4",
  children: "#f2a1b5",
  self: "#c8b6ff",
  meaning: "#b8c9e8",
  other: "#9a98a5",
};

/** Domeniile pe care conversația chiar le explorează, în ordinea din interfață. */
export const EXPLORABLE_DOMAINS: LifeDomain[] = [
  "money",
  "relationships",
  "health",
  "work",
  "family",
  "children",
  "self",
  "meaning",
];

export interface MindNode {
  id: string;
  user_id: string;
  type: NodeType;
  domain: LifeDomain;
  label: string;
  user_label: string | null;
  summary: string | null;
  confidence: number;
  /** Cea mai mare încredere atinsă vreodată. Nu coboară niciodată. */
  peak_confidence: number | null;
  /** Schema Young de care ține, dacă se potrivește clar uneia. */
  schema_code: string | null;
  verdict: NodeVerdict;
  /** Prezent doar în răspunsul hărții; lipsește la citirea unui singur nod. */
  work_status?: WorkStatus | null;
  /**
   * Când a strâns destule mențiuni ca să apară pe hartă. Null: încă o
   * ipoteză, nevăzută — stă în bază cu citatele ei și așteaptă să revină.
   */
  formed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Nodurile care se văd: cele formate din destule momente, neretrase. */
export function isFormed(node: Pick<MindNode, "formed_at">): boolean {
  return node.formed_at !== null;
}

export interface Observation {
  id: string;
  node_id: string;
  quote: string;
  source_message_id: string | null;
  sentiment: string | null;
  valence: number | null;
  observed_at: string;
}

export interface Edge {
  id: string;
  user_id: string;
  from_node: string;
  to_node: string;
  relation: string;
  strength: number;
  rationale: string | null;
  created_at: string;
}

/** Convingerea nouă care ia locul celei vechi. Nodul vechi nu se șterge. */
export interface Transformation {
  id: string;
  user_id: string;
  node_id: string;
  new_label: string;
  rationale: string;
  status: TransformationStatus;
  created_at: string;
  adopted_at: string | null;
}

export type ExerciseMethod =
  | "behavioural_experiment"
  | "graded_exposure"
  | "thought_record"
  | "opposite_action"
  | "boundary_practice"
  | "self_compassion";

export const EXERCISE_METHOD_LABELS: Record<ExerciseMethod, string> = {
  behavioural_experiment: "Experiment",
  graded_exposure: "Pas mic",
  thought_record: "Gând prins",
  opposite_action: "Contrariul",
  boundary_practice: "Graniță",
  self_compassion: "Vocea",
};

export interface Recommendation {
  id: string;
  user_id: string;
  node_id: string;
  transformation_id: string | null;
  kind: RecommendationKind;
  title: string;
  creator: string | null;
  year: number | null;
  rationale: string;
  status: RecommendationStatus;
  created_at: string;
  completed_at: string | null;
  /** Doar la exerciții: structura care le face executabile, nu doar sugerate. */
  method: ExerciseMethod | null;
  trigger_cue: string | null;
  action: string | null;
  record_prompt: string | null;
  review_after_days: number | null;
}

/** O dată când omul a făcut exercițiul și a notat ce s-a întâmplat. */
export interface ExerciseLog {
  id: string;
  recommendation_id: string;
  did_it: boolean;
  note: string | null;
  fear_confirmed: number | null;
  logged_at: string;
}

/**
 * Ce s-a schimbat în hartă în urma unei replici.
 * Fiecare conversație se termină aici: harta se animă și arată diferența.
 */
export interface MapDiff {
  /** Noduri care au apărut pe hartă acum: au strâns destule momente. */
  created: Array<{ id: string; type: NodeType; label: string }>;
  strengthened: Array<{ id: string; label: string; confidence: number }>;
  connected: Array<{ from: string; to: string; relation: string }>;
  /**
   * Ipoteze atinse, dar încă nevăzute: au o mențiune sau două și mai au
   * nevoie de discuție. Omului i se spune că se conturează ceva, nu ce.
   */
  forming: number;
}

/**
 * Cât s-a mișcat o convingere de la vârful ei.
 *
 * Nu întrebăm omul cum se simte pe o scară de la 1 la 10 — măsurăm din ce a
 * spus: dacă tiparul apare mai rar și mai slab decât apărea, încrederea scade,
 * iar diferența față de vârf este schimbarea reală.
 */
export interface ChangeDegree {
  points: number;
  weakened: boolean;
  label: string;
}

export function changeDegree(node: Pick<MindNode, "confidence" | "peak_confidence">): ChangeDegree {
  const peak = node.peak_confidence ?? node.confidence;
  const points = Math.round((peak - node.confidence) * 100);

  if (points < 5) {
    return { points: 0, weakened: false, label: "Neschimbată încă" };
  }

  return {
    points,
    weakened: true,
    label: `S-a slăbit cu ${points} puncte față de vârf`,
  };
}

/** Nodul așa cum îl vede utilizatorul: formularea lui o înlocuiește pe a modelului. */
export function displayLabel(node: Pick<MindNode, "label" | "user_label">): string {
  return node.user_label ?? node.label;
}
