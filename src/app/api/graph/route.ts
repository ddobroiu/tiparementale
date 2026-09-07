import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";
import type { Edge, MindNode } from "@/lib/types";

/** Harta curentă. Nodurile respinse rămân în bază, dar ies din vizualizare. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const graph = await withUser(user.id, async (client) => {
    const { rows: nodes } = await client.query<MindNode>(
      "select * from nodes where archived_at is null order by created_at",
    );
    const { rows: edges } = await client.query<Edge>("select * from edges");
    return { nodes, edges };
  });

  return NextResponse.json(graph);
}
