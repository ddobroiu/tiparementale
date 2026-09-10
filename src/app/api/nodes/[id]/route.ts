import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";
import type {
  MindNode,
  NodeVerdict,
  Observation,
  Recommendation,
  Transformation,
} from "@/lib/types";

const VERDICTS: NodeVerdict[] = ["unconfirmed", "confirmed", "rejected", "edited"];

/** Nodul cu tot ce îl susține: citatele și evoluția lui în timp. */
export async function GET(_request: Request, context: RouteContext<"/api/nodes/[id]">) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { id } = await context.params;

  const payload = await withUser(user.id, async (client) => {
    const { rows: nodes } = await client.query<MindNode>("select * from nodes where id = $1", [id]);
    if (nodes.length === 0) return null;

    const [observations, history, recommendations, transformations, exerciseLogs] =
      await Promise.all([
      client.query<Observation>(
        "select * from observations where node_id = $1 order by observed_at desc",
        [id],
      ),
      client.query(
        "select * from node_history where node_id = $1 order by changed_at desc",
        [id],
      ),
      client.query<Recommendation>(
        "select * from recommendations where node_id = $1 order by created_at desc",
        [id],
      ),
      client.query<Transformation>(
        "select * from transformations where node_id = $1 order by created_at desc",
        [id],
      ),
      // Urmărirea exercițiilor: fără ea, progresul rămâne declarat, nu măsurat.
      client.query(
        `select l.id, l.recommendation_id, l.did_it, l.note, l.fear_confirmed, l.logged_at
           from exercise_logs l
           join recommendations r on r.id = l.recommendation_id
          where r.node_id = $1
          order by l.logged_at`,
        [id],
      ),
    ]);

    return {
      node: nodes[0],
      observations: observations.rows,
      history: history.rows,
      recommendations: recommendations.rows,
      transformations: transformations.rows,
      exerciseLogs: exerciseLogs.rows,
    };
  });

  if (!payload) {
    return NextResponse.json({ error: "Nodul nu există" }, { status: 404 });
  }

  return NextResponse.json(payload);
}

/**
 * Verdictul utilizatorului. Aceasta este bucla care face harta precisă:
 * ce confirmă devine adevăr în promptul următor, ce respinge devine exemplu
 * negativ.
 */
export async function PATCH(request: Request, context: RouteContext<"/api/nodes/[id]">) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const verdict: unknown = body?.verdict;
  const userLabel: unknown = body?.user_label;

  const outcome = await withUser(user.id, async (client) => {
    const { rows } = await client.query<MindNode>("select * from nodes where id = $1", [id]);
    const existing = rows[0];
    if (!existing) return { status: 404 as const, error: "Nodul nu există" };

    let nextVerdict: NodeVerdict | null = null;
    let nextLabel: string | null = null;

    if (typeof verdict === "string" && VERDICTS.includes(verdict as NodeVerdict)) {
      nextVerdict = verdict as NodeVerdict;
    }

    if (typeof userLabel === "string" && userLabel.trim().length > 0) {
      nextLabel = userLabel.trim();
      nextVerdict = "edited";
    }

    if (!nextVerdict && !nextLabel) {
      return { status: 400 as const, error: "Nimic de actualizat" };
    }

    // Un nod respins nu se șterge: iese din hartă, rămâne ca exemplu negativ.
    const archivedAt = nextVerdict === "rejected" ? new Date().toISOString() : null;

    const { rows: updated } = await client.query<MindNode>(
      `update nodes
          set verdict = coalesce($1, verdict),
              user_label = coalesce($2, user_label),
              archived_at = $3
        where id = $4
        returning *`,
      [nextVerdict, nextLabel, archivedAt, id],
    );

    if (nextVerdict && nextVerdict !== existing.verdict) {
      await client.query(
        `insert into node_history (node_id, user_id, field, old_value, new_value)
         values ($1, $2, 'verdict', $3, $4)`,
        [id, user.id, existing.verdict, nextVerdict],
      );
    }

    if (nextLabel && nextLabel !== existing.user_label) {
      await client.query(
        `insert into node_history (node_id, user_id, field, old_value, new_value)
         values ($1, $2, 'user_label', $3, $4)`,
        [id, user.id, existing.user_label ?? existing.label, nextLabel],
      );
    }

    return { status: 200 as const, node: updated[0] };
  });

  if (outcome.status !== 200) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }

  return NextResponse.json({ node: outcome.node });
}
