import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Administrare",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Tablou" },
  { href: "/admin/utilizatori", label: "Utilizatori" },
];

/**
 * Poarta zonei de administrare: fiecare pagină de sub /admin trece pe aici,
 * deci verificarea se face o singură dată și nu poate fi uitată.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <main className="min-h-screen">
      <header className="border-b border-ink-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/harta">
              <Logo />
            </Link>
            <span className="rounded-full border border-[color:var(--emotion)]/40 px-2.5 py-0.5 text-[11px] tracking-[0.12em] text-[color:var(--emotion)] uppercase">
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-paper-dim transition-colors hover:bg-ink-soft hover:text-paper"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/harta"
              className="ml-2 rounded-full border border-ink-line px-3 py-1.5 text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
            >
              Harta mea
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>

      <p className="mx-auto max-w-6xl px-4 pb-10 text-xs text-paper-faint sm:px-6">
        Conectat ca {admin.email}. Tot ce faci aici se scrie în registru.
      </p>
    </main>
  );
}
