import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";

/**
 * Verdictul omului asupra a două convingeri care păreau identice.
 *
 * „Sunt același lucru” unește nodurile. Unirea păstrează nodul mai vechi și mai
 * sigur, mută în el toate observațiile celuilalt și îl arhivează pe acesta din
 * urmă — nu îl șterge. Citatele nu se pierd niciodată: ele sunt dovada din care
 * s-a născut convingerea, iar fără ele harta nu mai poate răspunde la „de unde
 * știi asta despre mine”.
 */
export async function PATCH(request: Request, context: RouteContext<"/api/similarities/[id]">) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (status !== "same" && status !== "different") {
    return NextResponse.json({ error: "Verdict necunoscut" }, { status: 400 });
  }

  const outcome = await withUser(user.id, async (client) => {
    const { rows } = await client.query<{ node_a: string; node_b: string }>(
      `update node_similarities set status = $1
        where id = $2 and status = 'pending'
        returning node_a, node_b`,
      [status, id],
    );

    const pair = rows[0];
    if (!pair) return null;
    if (status === "different") return { merged: false };

    // Rămâne cel mai vechi și cel mai sigur; celălalt se contopește în el.
    const { rows: both } = await client.query<{
      id: string;
      confidence: number;
      created_at: string;
      label: string;
      user_label: string | null;
    }>(
      `select id, confidence, created_at, label, user_label
         from nodes where id = any($1::uuid[])`,
      [[pair.node_a, pair.node_b]],
    );

    if (both.length !== 2) return { merged: false };

    const [keep, drop] = [...both].sort(
      (x, y) =>
        y.confidence - x.confidence ||
        new Date(x.created_at).getTime() - new Date(y.created_at).getTime(),
    );

    await client.query("update observations set node_id = $1 where node_id = $2", [
      keep.id,
      drop.id,
    ]);

    // Încrederea celui păstrat crește: două formulări ale aceleiași convingeri
    // înseamnă că a apărut de mai multe ori decât credeam.
    await client.query(
      `update nodes set confidence = least(1, confidence + 0.1) where id = $1`,
      [keep.id],
    );

    await client.query(
      "update nodes set archived_at = now(), verdict = 'rejected' where id = $1",
      [drop.id],
    );

    await client.query(
      `insert into node_history (node_id, user_id, field, old_value, new_value)
       values ($1, $2, 'unire', $3, $4)`,
      [
        keep.id,
        user.id,
        drop.user_label ?? drop.label,
        keep.user_label ?? keep.label,
      ],
    );

    return { merged: true, keptId: keep.id };
  });

  if (!outcome) {
    return NextResponse.json({ error: "Perechea nu există" }, { status: 404 });
  }

  return NextResponse.json(outcome);
}
