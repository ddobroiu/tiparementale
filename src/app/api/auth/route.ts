import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import {
  createSession,
  destroySession,
  hashPassword,
  hashToken,
  verifyPassword,
} from "@/lib/auth";
import { appUrl } from "@/lib/billing/stripe";
import { query } from "@/lib/db";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";
import { readMetaClient, sendMetaEvent } from "@/lib/meta/capi";

interface UserRow extends Record<string, unknown> {
  id: string;
  email: string;
  password_hash: string;
}

/** Aceeași formulare pentru email inexistent și parolă greșită: nu confirmăm cine are cont. */
const CREDENTIALS_ERROR = "Email sau parolă greșite.";
const PASSWORD_ERROR = "Parola trebuie să aibă cel puțin 10 caractere.";
const RESET_MINUTES = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const validEmail = email.includes("@") && email.length <= 320;

  if (action === "logout") {
    await destroySession();
    return NextResponse.json({ ok: true });
  }

  if (action === "register") {
    if (!validEmail) return invalidEmail();
    if (password.length < 10) {
      return NextResponse.json({ error: PASSWORD_ERROR }, { status: 400 });
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

    // Cont nou, raportat la Meta de pe server (browserul îl raportează și el,
    // cu același ID). Nu așteptăm și nu condiționăm nimic de răspuns.
    const eventId = typeof body?.eventId === "string" ? body.eventId.slice(0, 64) : "";
    if (eventId) {
      void sendMetaEvent({
        name: "CompleteRegistration",
        eventId,
        email: created[0].email,
        externalId: created[0].id,
        client: readMetaClient(request),
        customData: { status: true },
      });
    }

    // Contul există deja; e-mailul e o curtoazie, nu o condiție.
    await sendWelcomeEmail(created[0].email, `${appUrl()}/harta`);
    return NextResponse.json({ ok: true });
  }

  if (action === "login") {
    if (!validEmail) return invalidEmail();

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

  /**
   * Cererea de resetare răspunde la fel indiferent dacă adresa are cont sau
   * nu — altfel formularul devine un mod de a afla cine e înscris.
   */
  if (action === "reset-request") {
    if (!validEmail) return invalidEmail();

    const rows = await query<UserRow>("select id, email from users where lower(email) = $1", [
      email,
    ]);
    const user = rows[0];

    if (user) {
      // Un singur link valabil la un moment dat: cererile vechi se anulează.
      await query(
        "delete from password_resets where user_id = $1 and used_at is null",
        [user.id],
      );

      const token = randomBytes(32).toString("base64url");
      await query(
        `insert into password_resets (user_id, token_hash, expires_at)
         values ($1, $2, now() + ($3 || ' minutes')::interval)`,
        [user.id, hashToken(token), String(RESET_MINUTES)],
      );

      const sent = await sendPasswordResetEmail(user.email, `${appUrl()}/resetare/${token}`);
      if (!sent) {
        return NextResponse.json(
          { error: "Nu am putut trimite e-mailul. Încearcă din nou în câteva minute." },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "reset") {
    const token = typeof body?.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "Link incomplet." }, { status: 400 });
    }
    if (password.length < 10) {
      return NextResponse.json({ error: PASSWORD_ERROR }, { status: 400 });
    }

    const rows = await query<{ id: string; user_id: string }>(
      `select id, user_id from password_resets
        where token_hash = $1 and used_at is null and expires_at > now()`,
      [hashToken(token)],
    );
    const reset = rows[0];
    if (!reset) {
      return NextResponse.json(
        { error: "Linkul a expirat sau a fost deja folosit. Cere unul nou." },
        { status: 400 },
      );
    }

    await query("update users set password_hash = $1 where id = $2", [
      await hashPassword(password),
      reset.user_id,
    ]);
    await query("update password_resets set used_at = now() where id = $1", [reset.id]);
    // Parola s-a schimbat pentru că cineva n-o mai știa sau n-o mai voia:
    // orice sesiune veche, de oriunde, se închide.
    await query("delete from auth_sessions where user_id = $1", [reset.user_id]);

    await createSession(reset.user_id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acțiune necunoscută." }, { status: 400 });
}

function invalidEmail() {
  return NextResponse.json({ error: "Adresa de email nu pare validă." }, { status: 400 });
}
