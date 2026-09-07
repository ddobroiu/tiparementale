import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";

/**
 * Răspunsul omului la o predicție.
 *
 * Aici se închide bucla de precizie. O predicție confirmată întărește
 * convingerea din care a fost derivată; una respinsă o slăbește, fiindcă
 * înseamnă că am dedus greșit dintr-un element pe care omul îl validase — cel
 * mai clar semnal de calibrare pe care îl putem primi.
 *
 * Mișcările sunt mici. O singură predicție nu trebuie să răstoarne o convingere
 * construită din mai multe conversații.
 */
const DELTA_CONFIRMED = 0.08;
const DELTA_REJECTED = -0.12;

export async function PATCH(request: Request, context: RouteContext<"/api/predictions/[id]">) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const answer = body?.answer;

  if (answer !== "confirmed" && answer !== "rejected") {
    return NextResponse.json({ error: "Răspuns necunoscut" }, { status: 400 });
  }

  const outcome = await withUser(user.id, async (client) => {
    const { rows } = await client.query<{ node_id: string }>(
      `update predictions set status = $1, answered_at = now()
        where id = $2 and status = 'pending'
        returning node_id`,
      [answer, id],
    );

    const prediction = rows[0];
    if (!prediction) return null;

    const delta = answer === "confirmed" ? DELTA_CONFIRMED : DELTA_REJECTED;

    const { rows: updated } = await client.query<{
      confidence: number;
      label: string;
      user_label: string | null;
    }>(
      `update nodes
          set confidence = least(1, greatest(0, confidence + $1))
        where id = $2
        returning confidence, label, user_label`,
      [delta, prediction.node_id],
    );

    await client.query(
      `insert into node_history (node_id, user_id, field, old_value, new_value)
       values ($1, $2, 'predictie', $3, $4)`,
      [
        prediction.node_id,
        user.id,
        answer === "confirmed" ? "predicție confirmată" : "predicție respinsă",
        updated[0].confidence.toFixed(2),
      ],
    );

    return {
      nodeId: prediction.node_id,
      confidence: updated[0].confidence,
      label: updated[0].user_label ?? updated[0].label,
    };
  });

  if (!outcome) {
    return NextResponse.json({ error: "Predicția nu există" }, { status: 404 });
  }

  return NextResponse.json(outcome);
}
