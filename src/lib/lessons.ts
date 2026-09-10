import type { PoolClient } from "pg";

import type { LessonProgress } from "./program";

interface Row extends Record<string, unknown> {
  guide_id: string;
  id: string;
  turns: number;
  step_index: number;
  started_at: string;
  closed_at: string | null;
}

/**
 * Ultima ședință a utilizatorului pe fiecare lecție. Rulează în tranzacția
 * apelantului, deci RLS filtrează pe om. O ședință nouă pe aceeași lecție o
 * înlocuiește pe cea veche în această listă — istoricul rămâne în bază.
 */
export async function loadLessonProgress(client: PoolClient): Promise<LessonProgress[]> {
  const { rows } = await client.query<Row>(
    `select distinct on (guide_id)
            guide_id, id, turns, step_index, started_at, closed_at
       from conversations
      where guide_id is not null
      order by guide_id, started_at desc`,
  );

  return rows.map((r) => ({
    guideId: r.guide_id,
    conversationId: r.id,
    turns: r.turns,
    stepIndex: r.step_index,
    startedAt: String(r.started_at),
    closedAt: r.closed_at ? String(r.closed_at) : null,
  }));
}
