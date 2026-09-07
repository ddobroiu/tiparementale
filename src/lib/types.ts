export type NodeType =
  | "belief"
  | "value"
  | "emotion"
  | "goal"
  | "pattern"
  | "fear"
  | "relationship";

export type NodeVerdict = "unconfirmed" | "confirmed" | "rejected" | "edited";

export type InputMode = "text" | "voice";

export type RecommendationKind = "exercise" | "book" | "film";

export type RecommendationStatus =
  | "suggested"
  | "in_progress"
  | "done"
  | "dismissed"
  | "inaccurate";

export type SafetyFlag = "none" | "distress" | "crisis";

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  belief: "Convingere",
  value: "Valoare",
  emotion: "Emoție",
  goal: "Obiectiv",
  pattern: "Tipar",
  fear: "Temere",
  relationship: "Relație",
};

export interface MindNode {
  id: string;
  user_id: string;
  type: NodeType;
  label: string;
  user_label: string | null;
  summary: string | null;
  confidence: number;
  verdict: NodeVerdict;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
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

export interface Recommendation {
  id: string;
  user_id: string;
  node_id: string;
  kind: RecommendationKind;
  title: string;
  creator: string | null;
  year: number | null;
  rationale: string;
  status: RecommendationStatus;
  created_at: string;
  completed_at: string | null;
}

/**
 * Ce s-a schimbat în hartă în urma unei replici.
 * Fiecare conversație se termină aici: harta se animă și arată diferența.
 */
export interface MapDiff {
  created: Array<{ id: string; type: NodeType; label: string }>;
  strengthened: Array<{ id: string; label: string; confidence: number }>;
  connected: Array<{ from: string; to: string; relation: string }>;
}

/** Nodul așa cum îl vede utilizatorul: formularea lui o înlocuiește pe a modelului. */
export function displayLabel(node: Pick<MindNode, "label" | "user_label">): string {
  return node.user_label ?? node.label;
}
