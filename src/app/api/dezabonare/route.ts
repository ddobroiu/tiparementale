import { NextResponse } from "next/server";

import { appUrl } from "@/lib/billing/stripe";
import { query } from "@/lib/db";

/**
 * Dezabonarea, fără cont și fără parolă: cheia e id-ul e-mailului primit
 * (aleator, negăsibil), din linkul din subsol sau din antetul List-Unsubscribe.
 *
 * POST — cu un click din clientul de e-mail (RFC 8058: corpul e
 * `List-Unsubscribe=One-Click`) sau din butonul de pe /dezabonare. GET nu
 * dezabonează nimic: scanerele de linkuri deschid adresele din e-mailuri, iar
 * un GET care schimbă ceva i-ar dezabona pe oameni fără să știe. GET duce
 * doar la pagina de confirmare.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const target = new URL("/dezabonare", appUrl());
  if (UUID.test(id)) target.searchParams.set("id", id);
  return NextResponse.redirect(target, 303);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let id = url.searchParams.get("id") ?? "";
  let fromPage = false;

  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    const formId = form?.get("id");
    if (typeof formId === "string" && formId) id = formId;
    fromPage = form?.get("from") === "page";
  }

  if (!UUID.test(id)) {
    return fromPage
      ? NextResponse.redirect(new URL("/dezabonare?eroare=1", appUrl()), 303)
      : NextResponse.json({ error: "Link invalid" }, { status: 400 });
  }

  const [log] = await query<{ email: string }>("select email from email_log where id = $1", [id]);
  if (!log) {
    return fromPage
      ? NextResponse.redirect(new URL("/dezabonare?eroare=1", appUrl()), 303)
      : NextResponse.json({ error: "Link necunoscut" }, { status: 404 });
  }

  const email = log.email.toLowerCase();
  await query(
    `insert into email_unsubscribes (email, email_log_id) values ($1, $2)
     on conflict (email) do nothing`,
    [email, id],
  );
  await query(
    `update users set marketing_opt_out = true, marketing_choice_at = now()
      where lower(email) = $1 and not marketing_opt_out`,
    [email],
  );
  await query(
    "update leads set unsubscribed_at = now() where lower(email) = $1 and unsubscribed_at is null",
    [email],
  );

  return fromPage
    ? NextResponse.redirect(new URL("/dezabonare?gata=1", appUrl()), 303)
    : NextResponse.json({ ok: true });
}
