import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";

import { query } from "./db";

const scryptAsync = promisify(scrypt);

const COOKIE = "tm_session";
const SESSION_DAYS = 30;
const KEY_LENGTH = 64;

export interface SessionUser extends Record<string, unknown> {
  id: string;
  email: string;
  display_name: string | null;
}

// ---------------------------------------------------------------- parole

/**
 * scrypt este în nucleul Node, deci nu adaugă o dependență nativă, și este o
 * funcție de derivare potrivită pentru parole. Sarea este per utilizator.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(hash, "hex");

  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

// ---------------------------------------------------------------- sesiuni

/** În bază se păstrează doar hash-ul: o citire a tabelului nu dă acces nimănui. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `insert into auth_sessions (user_id, token_hash, expires_at) values ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt],
  );

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const rows = await query<SessionUser>(
    `select u.id, u.email, u.display_name
       from auth_sessions s
       join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  );

  return rows[0] ?? null;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;

  if (token) {
    await query(`delete from auth_sessions where token_hash = $1`, [hashToken(token)]);
  }
  store.delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
