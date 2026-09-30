import { appUrl } from "@/lib/billing/stripe";

/**
 * „Continuă cu Google”, fără bibliotecă: OAuth 2.0 / OpenID Connect cu
 * `openid email profile`. Fără GOOGLE_CLIENT_ID și GOOGLE_CLIENT_SECRET,
 * butonul nu apare, iar rutele răspund 404.
 */

/** Cookie-urile fluxului: `state` anti-CSRF, ținta de după și acordurile de la „Cont nou”. */
export const GOOGLE_STATE_COOKIE = "g_oauth_state";
export const GOOGLE_REDIRECT_COOKIE = "g_oauth_redirect";
export const GOOGLE_SIGNUP_COOKIE = "g_oauth_signup";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Trebuie autorizat exact așa în Google Cloud (Authorized redirect URIs). */
export function googleRedirectUri(): string {
  return `${appUrl()}/api/auth/callback/google`;
}
