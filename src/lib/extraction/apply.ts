import type { PoolClient } from "pg";

import { SCHEMA_BY_CODE } from "@/lib/schemas";
import type { MapDiff, MindNode } from "@/lib/types";
import { displayLabel, isFormed } from "@/lib/types";
import type { ExtractedObservation, Extraction } from "./schema";

/**
 * Din câte momente distincte se formează un nod.
 *
 * O convingere e o regulă care revine, nu o remarcă. Un nod cu o mențiune
 * sau două rămâne ipoteză nevăzută: stă în bază, cu citatele lui, intră în
 * indexul extracției și așteaptă să revină în discuție. Apare pe hartă abia
 * când a fost spus în atâtea momente — o scenă de demult, una de acum,
 * consecința trasă din ele. Discuția trebuie să-l fi lucrat, nu doar atins.
 */
export const FORMATION_THRESHOLD = 3;

interface SourceMessage {
  id: string;
  content: string;
}

interface ApplyInput {
  client: PoolClient;
  userId: string;
  /** Mesajele din care s-a extras, ca fiecare citat să-și găsească sursa. */
  sourceMessages: SourceMessage[];
  extraction: Extraction;
  /** Nodurile trimise modelului. Servesc drept listă de id-uri valide. */
  knownNodes: MindNode[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Extracția rulează pe mai multe mesaje odată, iar modelul nu spune din care
 * anume provine fiecare citat. Îl căutăm: dacă textul se regăsește, citatul
 * primește sursa exactă; altfel, ultimul mesaj din bucată.
 */
function resolveSource(quote: string, messages: SourceMessage[]): string | null {
  if (messages.length === 0) return null;

  const needle = normalize(quote);
  const match = messages.find((m) => normalize(m.content).includes(needle));

  return (match ?? messages[messages.length - 1]).id;
}

/**
 * Un moment, un citat. Modelul primește voie să dea mai multe observații
 * pentru același nod, dar nu să numere de două ori același lucru: citatele
 * goale și cele identice (după spații și majuscule) se aruncă.
 */
function distinctObservations(observations: ExtractedObservation[]): ExtractedObservation[] {
  const seen = new Set<string>();
  const kept: ExtractedObservation[] = [];
  for (const obs of observations) {
    const key = normalize(obs.quote);
    if (key.length === 0 || seen.has(key)) continue;
    seen.add(key);
    kept.push(obs);
  }
  return kept;
}

async function insertObservations(
  client: PoolClient,
  userId: string,
  nodeId: string,
  observations: ExtractedObservation[],
  sourceMessages: SourceMessage[],
): Promise<void> {
  for (const obs of observations) {
    await client.query(
      `insert into observations (node_id, user_id, quote, source_message_id, sentiment, valence)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        nodeId,
        userId,
        obs.quote,
        resolveSource(obs.quote, sourceMessages),
        obs.sentiment,
        clamp(obs.valence, -1, 1),
      ],
    );
  }
}

/**
 * Scrie extracția în bază și întoarce diferența produsă în hartă.
 *
 * Tot ce vine de la model este verificat față de nodurile cunoscute: un id
 * inventat sau o încercare de a atinge un nod respins sunt ignorate în tăcere,
 * nu propagate în hartă.
 *
 * Nodul se formează aici, nu în model: când numărul de observații atinge
 * pragul, primește `formed_at` și abia atunci e raportat ca „nou”. Un nod
 * nou cu o singură observație e sămânță — intră în bază, nu în diferență.
 *
 * Rulează pe conexiunea deschisă de `withUser`, deci în aceeași tranzacție:
 * dacă ceva eșuează la jumătate, harta nu rămâne pe jumătate actualizată.
 */
export async function applyExtraction({
  client,
  userId,
  sourceMessages,
  extraction,
  knownNodes,
}: ApplyInput): Promise<MapDiff> {
  const diff: MapDiff = { created: [], strengthened: [], connected: [], forming: 0 };

  const byId = new Map(knownNodes.map((n) => [n.id, n]));
  /** temp_id sau id real -> id real în bază */
  const resolved = new Map<string, string>();
  for (const node of knownNodes) resolved.set(node.id, node.id);

  // ---------------------------------------------------------------- noduri noi

  for (const incoming of extraction.new_nodes) {
    const observations = distinctObservations(incoming.observations);
    // Nimic fără sursă: un nod fără niciun citat nu intră în bază.
    if (observations.length === 0) continue;

    const formed = observations.length >= FORMATION_THRESHOLD;

    const { rows } = await client.query<{ id: string; type: MindNode["type"]; label: string }>(
      `insert into nodes (user_id, type, domain, label, summary, confidence, schema_code, formed_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id, type, label`,
      [
        userId,
        incoming.type,
        incoming.domain,
        incoming.label,
        incoming.summary,
        clamp(incoming.confidence, 0, 1),
        // Doar coduri din taxonomie: un cod inventat de model nu intră în bază.
        incoming.schema_code && SCHEMA_BY_CODE.has(incoming.schema_code)
          ? incoming.schema_code
          : null,
        formed ? new Date() : null,
      ],
    );

    const row = rows[0];
    resolved.set(incoming.temp_id, row.id);
    await insertObservations(client, userId, row.id, observations, sourceMessages);

    if (formed) {
      diff.created.push({ id: row.id, type: row.type, label: row.label });
    } else {
      diff.forming += 1;
    }
  }

  // ------------------------------------------------------------ actualizări

  for (const update of extraction.node_updates) {
    const existing = byId.get(update.node_id);

    // id inventat de model, sau nod pe care utilizatorul l-a respins deja
    if (!existing || existing.verdict === "rejected") continue;

    const observations = distinctObservations(update.observations);
    if (observations.length === 0) continue;

    const confidence = clamp(
      existing.confidence + clamp(update.confidence_delta, -0.3, 0.3),
      0,
      1,
    );

    await client.query(
      `update nodes set confidence = $1, summary = coalesce($2, summary) where id = $3`,
      [confidence, update.summary, existing.id],
    );

    await insertObservations(client, userId, existing.id, observations, sourceMessages);

    if (confidence !== existing.confidence) {
      await client.query(
        `insert into node_history (node_id, user_id, field, old_value, new_value)
         values ($1, $2, 'confidence', $3, $4)`,
        [existing.id, userId, existing.confidence.toFixed(2), confidence.toFixed(2)],
      );
    }

    if (isFormed(existing)) {
      diff.strengthened.push({ id: existing.id, label: displayLabel(existing), confidence });
      continue;
    }

    // Ipoteză nevăzută: a strâns destule momente ca să apară?
    const { rows: counted } = await client.query<{ n: string }>(
      "select count(*) as n from observations where node_id = $1",
      [existing.id],
    );
    if (Number(counted[0].n) >= FORMATION_THRESHOLD) {
      await client.query("update nodes set formed_at = now() where id = $1", [existing.id]);
      await client.query(
        `insert into node_history (node_id, user_id, field, old_value, new_value)
         values ($1, $2, 'format', null, $3)`,
        [existing.id, userId, `din ${counted[0].n} momente`],
      );
      diff.created.push({ id: existing.id, type: existing.type, label: displayLabel(existing) });
    } else {
      diff.forming += 1;
    }
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

    // Legătura se raportează doar dacă ambele capete se văd; muchiile către
    // ipoteze rămân în bază și ies la iveală odată cu nodul.
    const visible = (id: string) => {
      if (diff.created.some((n) => n.id === id)) return true;
      const known = byId.get(id);
      return known ? isFormed(known) : false;
    };
    if (rowCount && visible(from) && visible(to)) {
      diff.connected.push({ from, to, relation: edge.relation });
    }
  }

  return diff;
}
