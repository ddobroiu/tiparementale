import type { SupabaseClient } from "@supabase/supabase-js";

import type { MapDiff, MindNode } from "@/lib/types";
import { displayLabel } from "@/lib/types";
import type { Extraction } from "./schema";

interface ApplyInput {
  supabase: SupabaseClient;
  userId: string;
  messageId: string;
  extraction: Extraction;
  /** Nodurile trimise modelului. Servesc drept listă de id-uri valide. */
  knownNodes: MindNode[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Scrie extracția în bază și întoarce diferența produsă în hartă.
 *
 * Tot ce vine de la model este verificat față de nodurile cunoscute: un id
 * inventat sau o încercare de a atinge un nod respins sunt ignorate în tăcere,
 * nu propagate în hartă.
 */
export async function applyExtraction({
  supabase,
  userId,
  messageId,
  extraction,
  knownNodes,
}: ApplyInput): Promise<MapDiff> {
  const diff: MapDiff = { created: [], strengthened: [], connected: [] };

  const byId = new Map(knownNodes.map((n) => [n.id, n]));
  /** temp_id sau id real -> id real în bază */
  const resolved = new Map<string, string>();
  for (const node of knownNodes) resolved.set(node.id, node.id);

  // ---------------------------------------------------------------- noduri noi

  if (extraction.new_nodes.length > 0) {
    const { data: inserted, error } = await supabase
      .from("nodes")
      .insert(
        extraction.new_nodes.map((n) => ({
          user_id: userId,
          type: n.type,
          label: n.label,
          summary: n.summary,
          confidence: clamp(n.confidence, 0, 1),
        })),
      )
      .select("id, type, label");

    if (error) throw error;

    const rows = inserted ?? [];
    const observations = [];

    for (const [i, row] of rows.entries()) {
      const source = extraction.new_nodes[i];
      resolved.set(source.temp_id, row.id);
      diff.created.push({ id: row.id, type: row.type, label: row.label });
      observations.push({
        node_id: row.id,
        user_id: userId,
        quote: source.observation.quote,
        source_message_id: messageId,
        sentiment: source.observation.sentiment,
        valence: clamp(source.observation.valence, -1, 1),
      });
    }

    if (observations.length > 0) {
      const { error: obsError } = await supabase.from("observations").insert(observations);
      if (obsError) throw obsError;
    }
  }

  // ------------------------------------------------------------ actualizări

  for (const update of extraction.node_updates) {
    const existing = byId.get(update.node_id);

    // id inventat de model, sau nod pe care utilizatorul l-a respins deja
    if (!existing || existing.verdict === "rejected") continue;

    const confidence = clamp(existing.confidence + clamp(update.confidence_delta, -0.3, 0.3), 0, 1);

    const { error } = await supabase
      .from("nodes")
      .update({
        confidence,
        ...(update.summary ? { summary: update.summary } : {}),
      })
      .eq("id", existing.id);

    if (error) throw error;

    const { error: obsError } = await supabase.from("observations").insert({
      node_id: existing.id,
      user_id: userId,
      quote: update.observation.quote,
      source_message_id: messageId,
      sentiment: update.observation.sentiment,
      valence: clamp(update.observation.valence, -1, 1),
    });
    if (obsError) throw obsError;

    if (confidence !== existing.confidence) {
      await supabase.from("node_history").insert({
        node_id: existing.id,
        user_id: userId,
        field: "confidence",
        old_value: existing.confidence.toFixed(2),
        new_value: confidence.toFixed(2),
      });
    }

    diff.strengthened.push({ id: existing.id, label: displayLabel(existing), confidence });
  }

  // ---------------------------------------------------------------- muchii

  const edges = extraction.new_edges
    .map((e) => ({
      from: resolved.get(e.from),
      to: resolved.get(e.to),
      relation: e.relation,
      strength: clamp(e.strength, 0, 1),
      rationale: e.rationale,
    }))
    .filter((e) => e.from && e.to && e.from !== e.to);

  if (edges.length > 0) {
    const { error } = await supabase.from("edges").upsert(
      edges.map((e) => ({
        user_id: userId,
        from_node: e.from!,
        to_node: e.to!,
        relation: e.relation,
        strength: e.strength,
        rationale: e.rationale,
      })),
      { onConflict: "from_node,to_node,relation", ignoreDuplicates: true },
    );

    if (error) throw error;

    for (const e of edges) {
      diff.connected.push({ from: e.from!, to: e.to!, relation: e.relation });
    }
  }

  return diff;
}
