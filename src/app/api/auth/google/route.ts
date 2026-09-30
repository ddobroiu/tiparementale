import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import {
  GOOGLE_REDIRECT_COOKIE,
  GOOGLE_SIGNUP_COOKIE,
  GOOGLE_STATE_COOKIE,
  googleConfigured,
  googleRedirectUri,
} from "@/lib/google";
import { safeRedirect } from "@/lib/redirect";

/**
 * Pornește „Continuă cu Google”: trimite vizitatorul la ecranul Google.
 * Un `state` aleator se pune într-un cookie HttpOnly și se verifică la
 * întoarcere (protecție CSRF). Redirect URI-ul autorizat în Google Cloud
 * trebuie să fie exact <NEXT_PUBLIC_APP_URL>/api/auth/callback/google.
 *
 * De pe „Cont nou”, butonul trimite și acordurile bifate în formular
 * (`acord=1`: termenii și consimțământul pentru datele sensibile) și alegerea
 * privind e-mailurile (`email=in|out`). Ele se țin într-un cookie scurt și se
 * folosesc doar dacă la întoarcere contul nu există încă. De pe „Intră” nu
 * vine nimic: fără acorduri, Google nu poate crea un cont nou.
 */
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const FLOW_SECONDS = 600;

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!googleConfigured()) return new NextResponse(null, { status: 404 });

  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });

  const response = NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: FLOW_SECONDS,
  };
  response.cookies.set(GOOGLE_STATE_COOKIE, state, options);

  const search = request.nextUrl.searchParams;
  response.cookies.set(GOOGLE_REDIRECT_COOKIE, safeRedirect(search.get("redirect")), options);

  const email = search.get("email");
  if (search.get("acord") === "1" && (email === "in" || email === "out")) {
    response.cookies.set(GOOGLE_SIGNUP_COOKIE, email, options);
  } else {
    response.cookies.delete(GOOGLE_SIGNUP_COOKIE);
  }
  return response;
}
