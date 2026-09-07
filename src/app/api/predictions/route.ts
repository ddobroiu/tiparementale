import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { recordUsage } from "@/lib/billing/entitlement";
import { withUser } from "@/lib/db";
import { PREDICTION_MODEL, generatePredictions } from "@/lib/predictions/generate";
import { describeAiError } from "@/lib/ai-error";
import type { MindNode } from "@/lib/types";

/** Câte convingeri confirmate sunt necesare ca predicțiile să merite ceva. */
const MIN_CONFIRMED = 2;

interface PredictionRow extends Record<string, unknown> {
  id: string;
  node_id: string;
  situation: string;
  behaviour: string;
  rationale: string;
  status: string;
  created_at: string;
}

/** Predicțiile la care omul nu a răspuns încă. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const data = await withUser(user.id, async (client) => {
    const { rows } = await client.query<PredictionRow>(
      `select p.*, coalesce(n.user_label, n.label) as node_label
         from predictions p
         join nodes n on n.id = p.node_id
        where p.status = 'pending'
        order by p.created_at
        limit 5`,
    );

    const { rows: counts } = await client.query<{ n: string }>(
      `select count(*) as n from nodes
        where verdict in ('confirmed', 'edited') and archived_at is null`,
    );

    return { pending: rows, confirmedCount: Number(counts[0].n) };
  });

  return NextResponse.json({
    predictions: data.pending,
    canGenerate: data.confirmedCount >= MIN_CONFIRMED,
    confirmedCount: data.confirmedCount,
    minConfirmed: MIN_CONFIRMED,
  });
}

/**
 * Generează un set nou de predicții din convingerile confirmate.
 *
 * Nu consumă o ședință: predicțiile sunt ieftine și sunt bucla care face harta
 * mai precisă. A le pune la plată ar însemna să taxăm omul pentru că ne ajută
 * să ne corectăm.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const nodes = await withUser(user.id, async (client) => {
    const { rows } = await client.query<MindNode>(
      `select * from nodes
        where verdict in ('confirmed', 'edited') and archived_at is null
        order by confidence desc
        limit 12`,
    );
    return rows;
  });

  if (nodes.length < MIN_CONFIRMED) {
    return NextResponse.json(
      {
        error:
          "Confirmă întâi câteva elemente pe hartă. Fără ele, orice predicție " +
          "ar fi ghicit.",
      },
      { status: 400 },
    );
  }

  let generated;
  try {
    generated = await generatePredictions({ nodes });
  } catch (error) {
    const failure = describeAiError(error, "predictions");
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }

  const { predictions, usage } = generated;

  const saved = await withUser(user.id, async (client) => {
    await recordUsage(client, {
      userId: user.id,
      conversationId: null,
      kind: "extraction",
      model: PREDICTION_MODEL,
      usage,
    });

    const rows: PredictionRow[] = [];

    for (const prediction of predictions) {
      const { rows: inserted } = await client.query<PredictionRow>(
        `insert into predictions (user_id, node_id, situation, behaviour, rationale)
         values ($1, $2, $3, $4, $5)
         returning *`,
        [
          user.id,
          prediction.node_id,
          prediction.situation,
          prediction.behaviour,
          prediction.rationale,
        ],
      );
      rows.push(inserted[0]);
    }

    return rows;
  });

  return NextResponse.json({ predictions: saved });
}
