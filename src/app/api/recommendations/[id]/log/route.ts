import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";

/**
 * Urmărirea unui exercițiu: omul spune dacă l-a făcut și ce s-a întâmplat.
 *
 * Aici se măsoară progresul, nu se declară. `fear_confirmed` — cât de mult s-a
 * confirmat frica, de la 0 la 10 — este cifra care scade în timp dacă
 * exercițiul lucrează, și singura dovadă pe care mintea nu o poate rescrie.
 */
export async function POST(request: Request, context: RouteContext<"/api/recommendations/[id]/log">) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  const didIt = body?.did_it === true;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 2000) : null;
  const fearRaw = Number(body?.fear_confirmed);
  const fear = Number.isInteger(fearRaw) && fearRaw >= 0 && fearRaw <= 10 ? fearRaw : null;

  const outcome = await withUser(user.id, async (client) => {
    const { rows } = await client.query<{ id: string; kind: string }>(
      "select id, kind from recommendations where id = $1",
      [id],
    );
    if (!rows[0]) return null;

    await client.query(
      `insert into exercise_logs (user_id, recommendation_id, did_it, note, fear_confirmed)
       values ($1, $2, $3, $4, $5)`,
      [user.id, id, didIt, note || null, fear],
    );

    // Primul „am făcut-o" mută exercițiul din „sugerat" în „în lucru".
    if (didIt) {
      await client.query(
        `update recommendations set status = 'in_progress'
          where id = $1 and status = 'suggested'`,
        [id],
      );
    }

    const { rows: logs } = await client.query<{
      did_it: boolean;
      fear_confirmed: number | null;
      logged_at: string;
    }>(
      `select did_it, fear_confirmed, logged_at from exercise_logs
        where recommendation_id = $1 order by logged_at`,
      [id],
    );

    return { logs };
  });

  if (!outcome) {
    return NextResponse.json({ error: "Exercițiul nu există" }, { status: 404 });
  }

  return NextResponse.json(outcome);
}
