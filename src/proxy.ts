import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth";

/**
 * Poartă ieftină: verifică doar existența cookie-ului de sesiune, fără să
 * atingă baza de date. Validarea reală se face în pagină sau în ruta de API,
 * care oricum au nevoie de utilizator.
 *
 * În Next.js 16 fișierul se numește `proxy`, nu `middleware`.
 */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPrivate =
    path.startsWith("/harta") || path.startsWith("/setari") || path.startsWith("/admin");

  if (isPrivate && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/intra";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/harta/:path*", "/setari/:path*", "/admin/:path*"],
};
