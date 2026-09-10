import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";

/**
 * Exportul complet al datelor omului, într-un singur fișier JSON.
 *
 * Promis în politica de confidențialitate și cerut de GDPR (portabilitate).
 * Tot ce e al lui, în forma brută: conversații, mesaje, noduri cu citatele lor,
 * legături, istoric, transformări, recomandări, jurnalul exercițiilor,
 * predicții, citiri, cumpărări. Fără ce nu e al lui: tokenii și costurile
 * noastre rămân în afara exportului.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const data = await withUser(user.id, async (client) => {
    const table = async (sql: string) => (await client.query(sql)).rows;

    return {
      exportat_la: new Date().toISOString(),
      cont: { email: user.email, nume: user.display_name },
      conversatii: await table("select * from conversations order by started_at"),
      mesaje: await table("select * from messages order by created_at"),
      noduri: await table("select * from nodes order by created_at"),
      observatii: await table("select * from observations order by observed_at"),
      legaturi: await table("select * from edges order by created_at"),
      istoric: await table("select * from node_history order by changed_at"),
      transformari: await table("select * from transformations order by created_at"),
      recomandari: await table("select * from recommendations order by created_at"),
      jurnal_exercitii: await table("select * from exercise_logs order by logged_at"),
      predictii: await table("select * from predictions order by created_at"),
      citiri: await table("select * from map_readings order by created_at"),
      cumparari: await table(
        "select pack_code, amount_ron, status, created_at, completed_at from purchases order by created_at",
      ),
    };
  });

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="tipare-mentale-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
