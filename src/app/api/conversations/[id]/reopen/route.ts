import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { MAX_TURNS_PER_SESSION } from "@/lib/billing/entitlement";
import { withUser } from "@/lib/db";
import { getGuide } from "@/lib/guides";

/**
 * Redeschide o lecție închisă înainte de a fi terminată, ca să poată fi
 * continuată de unde a rămas. Ședința e deja plătită: cât timp mai are
 * replici în ea, omul are dreptul la ele. O conversație cu replicile
 * consumate nu se redeschide — se începe alta.
 */
export async function POST(
  _request: Request,
  context: RouteContext<"/api/conversations/[id]/reopen">,
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { id } = await context.params;

  const result = await withUser(user.id, async (client) => {
    const { rows } = await client.query<{ turns: number; guide_id: string | null }>(
      "select turns, guide_id from conversations where id = $1",
      [id],
    );
    if (!rows[0]) return "missing" as const;
    // Lecția introductivă are mai puține replici decât o ședință obișnuită.
    const guide = rows[0].guide_id ? getGuide(rows[0].guide_id) : null;
    const maxTurns = guide?.maxTurns ?? MAX_TURNS_PER_SESSION;
    if (rows[0].turns >= maxTurns) return "spent" as const;
    await client.query("update conversations set closed_at = null where id = $1", [id]);
    return "ok" as const;
  });

  if (result === "missing") {
    return NextResponse.json({ error: "Conversația nu există." }, { status: 404 });
  }
  if (result === "spent") {
    return NextResponse.json(
      { error: "Ședința aceasta e consumată. Începe lecția din nou, cu altă ședință." },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
