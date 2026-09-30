import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { runLifecycle } from "@/lib/lifecycle/run";

/**
 * Cronul e-mailurilor, apelat de pe server la 15 minute (vezi DEPLOY.md):
 *
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://tiparementale.ro/api/cron/emails
 *
 * `?dry=1` doar numără ce ar pleca acum, pe feluri, fără să trimită nimic.
 * `?limit=N` (1–50) schimbă mărimea lotului; implicit 50, cu 600 ms între
 * trimiteri — Resend acceptă câteva pe secundă.
 */

const MAX_BATCH = 50;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  // Un secret gol sau scurt ar lăsa ruta deschisă oricui.
  if (secret.length < 16) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dry = url.searchParams.get("dry") === "1";
  const asked = Number(url.searchParams.get("limit"));
  const limit = Number.isInteger(asked) && asked > 0 ? Math.min(asked, MAX_BATCH) : MAX_BATCH;

  try {
    const report = await runLifecycle({ dry, limit });
    return NextResponse.json(report);
  } catch (error) {
    console.error("[cron/emails]", error);
    return NextResponse.json({ error: "Rularea a eșuat" }, { status: 500 });
  }
}
