import { NextResponse } from "next/server";

import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { query } from "@/lib/db";

interface UserRow extends Record<string, unknown> {
  id: string;
  email: string;
  password_hash: string;
}

/** Aceeași formulare pentru email inexistent și parolă greșită: nu confirmăm cine are cont. */
const CREDENTIALS_ERROR = "Email sau parolă greșite.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (action === "logout") {
    await destroySession();
    return NextResponse.json({ ok: true });
  }

  if (!email.includes("@") || email.length > 320) {
    return NextResponse.json({ error: "Adresa de email nu pare validă." }, { status: 400 });
  }

  if (action === "register") {
    if (password.length < 10) {
      return NextResponse.json(
        { error: "Parola trebuie să aibă cel puțin 10 caractere." },
        { status: 400 },
      );
    }

    const existing = await query<UserRow>("select id from users where lower(email) = $1", [email]);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Există deja un cont cu această adresă." },
        { status: 409 },
      );
    }

    const created = await query<UserRow>(
      "insert into users (email, password_hash) values ($1, $2) returning id, email",
      [email, await hashPassword(password)],
    );

    await createSession(created[0].id);
    return NextResponse.json({ ok: true });
  }

  if (action === "login") {
    const rows = await query<UserRow>(
      "select id, email, password_hash from users where lower(email) = $1",
      [email],
    );

    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: CREDENTIALS_ERROR }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acțiune necunoscută." }, { status: 400 });
}
