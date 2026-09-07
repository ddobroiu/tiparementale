import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";

interface PairRow extends Record<string, unknown> {
  id: string;
  score: number;
  a_id: string;
  a_label: string;
  b_id: string;
  b_label: string;
}

/** Perechile de convingeri care par să spună același lucru, încă nejudecate. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const pairs = await withUser(user.id, async (client) => {
    const { rows } = await client.query<PairRow>(
      `select s.id, s.score,
              a.id as a_id, coalesce(a.user_label, a.label) as a_label,
              b.id as b_id, coalesce(b.user_label, b.label) as b_label
         from node_similarities s
         join nodes a on a.id = s.node_a
         join nodes b on b.id = s.node_b
        where s.status = 'pending'
          and a.archived_at is null and b.archived_at is null
        order by s.score desc
        limit 5`,
    );
    return rows;
  });

  return NextResponse.json({ pairs });
}
