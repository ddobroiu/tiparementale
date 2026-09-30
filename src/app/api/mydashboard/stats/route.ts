import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { statsMydashboard } from "@/lib/stats";

export const dynamic = "force-dynamic";

/**
 * Statisticile aplicației pentru mydashboard.ro (contractul comun e în
 * mydashboard.ro/README.md). Antet: x-stats-token = MYDASHBOARD_STATS_TOKEN =
 * HMAC-SHA256(CRON_SECRET din mydashboard, 'stats:tiparementale'). Fără
 * variabilă, endpoint-ul nu există (404).
 */
export async function GET(request: Request) {
  const expected = process.env.MYDASHBOARD_STATS_TOKEN || "";
  if (!expected) return NextResponse.json({ error: "not found" }, { status: 404 });
  const token = request.headers.get("x-stats-token") || "";
  const given = Buffer.from(token);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await statsMydashboard(), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[mydashboard/stats]", e);
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
