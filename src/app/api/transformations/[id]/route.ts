import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";
import type { Transformation, TransformationStatus } from "@/lib/types";

const STATUSES: TransformationStatus[] = ["proposed", "practicing", "adopted", "dismissed"];

/** Unde a ajuns omul cu convingerea nouă: o exersează, a adoptat-o, sau nu i se potrivește. */
export async function PATCH(request: Request, context: RouteContext<"/api/transformations/[id]">) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const status: unknown = body?.status;

  if (typeof status !== "string" || !STATUSES.includes(status as TransformationStatus)) {
    return NextResponse.json({ error: "Stare necunoscută" }, { status: 400 });
  }

  const updated = await withUser(user.id, async (client) => {
    const { rows } = await client.query<Transformation>(
      `update transformations
          set status = $1,
              adopted_at = case when $1 = 'adopted' then now() else null end
        where id = $2
        returning *`,
      [status, id],
    );
    return rows[0] ?? null;
  });

  if (!updated) {
    return NextResponse.json({ error: "Nu există" }, { status: 404 });
  }

  return NextResponse.json({ transformation: updated });
}
