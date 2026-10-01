import { NextResponse, type NextRequest } from "next/server";

import { issueSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { appUrl } from "@/lib/billing/stripe";
import { query } from "@/lib/db";
import {
  GOOGLE_REDIRECT_COOKIE,
  GOOGLE_SIGNUP_COOKIE,
  GOOGLE_STATE_COOKIE,
  googleConfigured,
  googleRedirectUri,
} from "@/lib/google";
import { LEGAL_VERSION } from "@/lib/legal";
import { sendWelcomeNow } from "@/lib/lifecycle/run";
import { safeRedirect } from "@/lib/redirect";

/**
 * Întoarcerea de la Google: verifică `state`, schimbă codul pe token, citește
 * profilul (doar adrese confirmate de Google), găsește contul după e-mail sau
 * îl creează și deschide sesiunea. Cookie-ul de sesiune se pune direct pe
 * răspunsul de redirecționare, ca să nu se piardă.
 *
 * `users` și `auth_sessions` n-au RLS (vezi `db.ts`): ca la parolă, căutarea
 * se face înainte de a ști cine e omul, deci cu `query`, nu cu `withUser`.
 */
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

interface GoogleProfile {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  name?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!googleConfigured()) return new NextResponse(null, { status: 404 });

  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const back = safeRedirect(request.cookies.get(GOOGLE_REDIRECT_COOKIE)?.value);
  const signupConsents = request.cookies.get(GOOGLE_SIGNUP_COOKIE)?.value === "1";

  const finish = (response: NextResponse) => {
    response.cookies.delete(GOOGLE_STATE_COOKIE);
    response.cookies.delete(GOOGLE_REDIRECT_COOKIE);
    response.cookies.delete(GOOGLE_SIGNUP_COOKIE);
    return response;
  };
  const fail = (reason: string, register = false) => {
    const target = new URL("/intra", appUrl());
    if (register) target.searchParams.set("cont", "nou");
    target.searchParams.set("eroare", reason);
    if (back !== "/harta") target.searchParams.set("redirect", back);
    return finish(NextResponse.redirect(target));
  };

  // Omul a apăsat „Anulează” la Google sau a venit fără `state`-ul nostru.
  if (!code || !state || !storedState || state !== storedState) return fail("google");

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: googleRedirectUri(),
      }),
    });
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) throw new Error("No access token");

    const profileRes = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileRes.ok) throw new Error(`Userinfo failed: ${profileRes.status}`);
    const profile = (await profileRes.json()) as GoogleProfile;

    const email = profile.email?.trim().toLowerCase();
    if (!email || !profile.sub) throw new Error("Google profile without email or sub");
    // O adresă neconfirmată de Google nu dovedește nimic: n-o legăm de niciun cont.
    if (profile.email_verified !== true) return fail("google_neconfirmat");

    // Întâi după contul Google deja legat, apoi după e-mail: cine avea cont cu
    // parolă pe aceeași adresă intră în același cont.
    let user = (
      await query<{ id: string }>(
        `select id from users where google_sub = $1 or lower(email) = $2
          order by (google_sub = $1) desc nulls last limit 1`,
        [profile.sub, email],
      )
    )[0];

    if (!user) {
      // Cont nou doar cu acordurile bifate pe „Cont nou” (termenii și
      // consimțământul explicit pentru datele sensibile, art. 9 GDPR) — ca la
      // parolă. De pe „Intră”, omul e trimis să le bifeze.
      if (!signupConsents) return fail("google_fara_cont", true);

      // Ca la parolă: marketing permis, alegerea datată acum (refuzul, din
      // linkul de dezabonare din orice e-mail).
      // Prenumele, ca la înscrierea cu parolă: doar ca să ne adresăm omului.
      const firstName = (profile.given_name ?? "").trim().replace(/\s+/g, " ").slice(0, 60) || null;
      user = (
        await query<{ id: string }>(
          `insert into users (email, password_hash, google_sub, terms_accepted_at, terms_version,
                              sensitive_data_consent_at, display_name, marketing_opt_out, marketing_choice_at)
           values ($1, null, $2, now(), $3, now(), $4, false, now()) returning id`,
          [email, profile.sub, LEGAL_VERSION, firstName],
        )
      )[0];

      // Ca la parolă: curtoazie, nu condiție, și nu ține redirecționarea în loc.
      void sendWelcomeNow({ id: user.id, email, name: firstName }).catch((error) =>
        console.error("[google callback] bun venit:", error),
      );
    } else {
      await query(
        `update users set google_sub = $2
          where id = $1 and google_sub is null
            and not exists (select 1 from users where google_sub = $2)`,
        [user.id, profile.sub],
      );
    }

    const { token, expiresAt } = await issueSession(user.id);
    const response = NextResponse.redirect(new URL(back, appUrl()));
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    return finish(response);
  } catch (error) {
    console.error("[google callback]", error);
    return fail("google");
  }
}
