import { NextResponse } from "next/server";

import { query } from "@/lib/db";
import { LEAD_CONSENT_TEXT } from "@/lib/lifecycle/consent";
import { sendLeadWelcomeNow } from "@/lib/lifecycle/run";

/**
 * Formularul pentru vizitatorii fără cont: lecția introductivă pe e-mail.
 *
 * Acordul e o bifă explicită, fără de care nu se salvează nimic. Răspunsul e
 * același pentru o adresă nouă, una existentă, una cu cont sau una dezabonată
 * — formularul nu trebuie să spună cine e înscris. Câmpul `website` e o
 * capcană pentru roboți: oamenii nu-l văd, deci nu-l completează.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : "";
  const source = typeof body?.source === "string" ? body.source.slice(0, 200) : null;

  if (typeof body?.website === "string" && body.website !== "") {
    return NextResponse.json({ ok: true });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return NextResponse.json({ error: "Adresa de email nu pare validă." }, { status: 400 });
  }
  if (body?.consent !== true) {
    return NextResponse.json(
      { error: "Bifează acordul ca să-ți putem trimite lecția." },
      { status: 400 },
    );
  }

  // Cine are deja cont primește e-mailurile contului, nu pe cele de vizitator.
  const [user] = await query<{ id: string }>("select id from users where lower(email) = $1", [email]);
  if (user) return NextResponse.json({ ok: true });

  const [lead] = await query<{ id: string; name: string | null }>(
    `insert into leads (email, name, source_page, consent_at, consent_text)
     values ($1, $2, $3, now(), $4)
     on conflict ((lower(email))) do update
       set name = coalesce(excluded.name, leads.name)
     returning id, name`,
    [email, name || null, source, LEAD_CONSENT_TEXT],
  );

  const [blocked] = await query<{ email: string }>(
    `select email from email_unsubscribes where email = $1
     union all
     select email from leads where lower(email) = $1 and unsubscribed_at is not null`,
    [email],
  );

  // Lecția pleacă acum; dacă a mai plecat o dată, jurnalul o oprește.
  if (lead && !blocked) {
    await sendLeadWelcomeNow({ id: lead.id, email, name: lead.name }).catch((error) =>
      console.error("[leads] bun venit:", error),
    );
  }

  return NextResponse.json({ ok: true });
}
