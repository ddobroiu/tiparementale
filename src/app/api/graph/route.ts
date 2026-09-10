import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";
import { loadGraph } from "@/lib/graph";

/** Harta curentă. Nodurile respinse rămân în bază, dar ies din vizualizare. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const graph = await withUser(user.id, (client) => loadGraph(client));

  return NextResponse.json(graph);
}
