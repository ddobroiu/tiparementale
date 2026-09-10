import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";

/**
 * Închide o conversație: omul a apăsat „Închide”, lecția e făcută. O
 * conversație închisă nu mai primește replici și nu se mai reia — se începe
 * alta, cu altă ședință. De aici știe programul ce e bifat.
 */
export async function POST(
  _request: Request,
  context: RouteContext<"/api/conversations/[id]/close">,
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { id } = await context.params;

  const closed = await withUser(user.id, async (client) => {
    const { rowCount } = await client.query(
      "update conversations set closed_at = coalesce(closed_at, now()) where id = $1",
      [id],
    );
    return (rowCount ?? 0) > 0;
  });

  if (!closed) {
    return NextResponse.json({ error: "Conversația nu există." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
