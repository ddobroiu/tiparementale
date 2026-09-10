import { NextResponse } from "next/server";

import { destroySession, getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * Ștergerea contului. Definitivă.
 *
 * Promisă în politica de confidențialitate: „ștergerea contului elimină
 * definitiv conversațiile, harta, citatele și istoricul, fără copii de rezervă
 * păstrate ulterior”. Toate tabelele au `on delete cascade` către `users`, deci
 * un singur `delete` face curat peste tot — inclusiv jurnalul de consum, care
 * fără utilizator nu mai spune nimic util.
 *
 * Cere confirmarea adresei de email, ca un click greșit să nu șteargă doi ani
 * de hartă.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const confirm = typeof body?.confirm === "string" ? body.confirm.trim().toLowerCase() : "";

  if (confirm !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Scrie adresa de email a contului, exact, ca să confirmi." },
      { status: 400 },
    );
  }

  // Fără RLS aici, intenționat: `users` nu are politici, iar cascada face restul.
  await query("delete from users where id = $1", [user.id]);
  await destroySession();

  return NextResponse.json({ ok: true });
}
