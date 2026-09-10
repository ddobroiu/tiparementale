import { redirect } from "next/navigation";

import { getSessionUser, type SessionUser } from "./auth";

/**
 * Cine administrează: lista de adrese din `ADMIN_EMAILS`, separate prin
 * virgulă. Nu există un rol în bază — un cont devine administrator prin
 * configurare, pe server, nu printr-un câmp pe care l-ar putea atinge codul
 * aplicației.
 */
function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdmin(email: string | null | undefined): boolean {
  return Boolean(email) && adminEmails().has(email!.toLowerCase());
}

/** Pentru rutele de API: utilizatorul, dacă e administrator; altfel nimic. */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  return user && isAdmin(user.email) ? user : null;
}

/** Pentru pagini: administratorul, sau redirecționare. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/intra?redirect=/admin");
  if (!isAdmin(user.email)) redirect("/harta");
  return user;
}

// ---------------------------------------------------------------- formatare

export function lei(value: string | number): string {
  return `${Number(value).toLocaleString("ro-RO", { maximumFractionDigits: 0 })} lei`;
}

/** Costurile de model sunt în micro-dolari. */
export function usd(micro: string | number): string {
  return `$${(Number(micro) / 1_000_000).toFixed(2)}`;
}

export function dateShort(iso: string | Date | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

export function dateTime(iso: string | Date | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** „acum 3 zile”, ca să se vadă dintr-o privire cine e activ. */
export function ago(iso: string | Date | null): string {
  if (!iso) return "niciodată";
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 2) return "acum";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days} zile`;
  return `${Math.round(days / 30)} luni`;
}
