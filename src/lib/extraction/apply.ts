import type { PoolClient } from "pg";

import type { MapDiff, MindNode } from "@/lib/types";
import { displayLabel } from "@/lib/types";
import type { Extraction } from "./schema";

interface ApplyInput {
  client: PoolClient;
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
 *
 * Rulează pe conexiunea deschisă de `withUser`, deci în aceeași tranzacție:
 * dacă ceva eșuează la jumătate, harta nu rămâne pe jumătate actualizată.
 */
export async function applyExtraction({
  client,
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

  for (const incoming of extraction.new_nodes) {
    const { rows } = await client.query<{ id: string; type: MindNode["type"]; label: string }>(
      `insert into nodes (user_id, type, domain, label, summary, confidence)
       values ($1, $2, $3, $4, $5, $6)
       returning id, type, label`,
      [
        userId,
        incoming.type,
        incoming.domain,
        incoming.label,
        incoming.summary,
        clamp(incoming.confidence, 0, 1),
      ],
    );

    const row = rows[0];
    resolved.set(incoming.temp_id, row.id);
    diff.created.push({ id: row.id, type: row.type, label: row.label });

    await client.query(
      `insert into observations (node_id, user_id, quote, source_message_id, sentiment, valence)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        row.id,
        userId,
        incoming.observation.quote,
        messageId,
        incoming.observation.sentiment,
        clamp(incoming.observation.valence, -1, 1),
      ],
    );
  }

  // ------------------------------------------------------------ actualizări

  for (const update of extraction.node_updates) {
    const existing = byId.get(update.node_id);

    // id inventat de model, sau nod pe care utilizatorul l-a respins deja
    if (!existing || existing.verdict === "rejected") continue;

    const confidence = clamp(
      existing.confidence + clamp(update.confidence_delta, -0.3, 0.3),
      0,
      1,
    );

    await client.query(
      `update nodes set confidence = $1, summary = coalesce($2, summary) where id = $3`,
      [confidence, update.summary, existing.id],
    );

    await client.query(
      `insert into observations (node_id, user_id, quote, source_message_id, sentiment, valence)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        existing.id,
        userId,
        update.observation.quote,
        messageId,
        update.observation.sentiment,
        clamp(update.observation.valence, -1, 1),
      ],
    );

    if (confidence !== existing.confidence) {
      await client.query(
        `insert into node_history (node_id, user_id, field, old_value, new_value)
         values ($1, $2, 'confidence', $3, $4)`,
        [existing.id, userId, existing.confidence.toFixed(2), confidence.toFixed(2)],
      );
    }

    diff.strengthened.push({ id: existing.id, label: displayLabel(existing), confidence });
  }

  // ---------------------------------------------------------------- muchii

  for (const edge of extraction.new_edges) {
    const from = resolved.get(edge.from);
    const to = resolved.get(edge.to);
    if (!from || !to || from === to) continue;

    const { rowCount } = await client.query(
      `insert into edges (user_id, from_node, to_node, relation, strength, rationale)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (from_node, to_node, relation) do nothing`,
      [userId, from, to, edge.relation, clamp(edge.strength, 0, 1), edge.rationale],
    );

    if (rowCount) diff.connected.push({ from, to, relation: edge.relation });
  }

  return diff;
}
