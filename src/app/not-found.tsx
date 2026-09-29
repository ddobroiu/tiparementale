import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

// Next.js trimite singur status 404 și un <meta name="robots" content="noindex">;
// fără robots aici s-ar mai scrie și "index, follow" moștenit din layout.
export const metadata: Metadata = {
  title: "Pagina nu există",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <p className="text-xs tracking-widest text-paper-faint uppercase">Eroare 404</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Pagina nu există.</h1>
        <p className="mt-6 text-lg leading-relaxed text-paper-dim">
          Linkul e greșit sau pagina a fost mutată. De aici poți merge la program, la articole sau la
          pagina principală.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/program"
            className="rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Vezi programul
          </Link>
          <Link
            href="/articole"
            className="rounded-full border border-ink-line px-6 py-3 text-sm transition-colors hover:border-paper-faint"
          >
            Articole
          </Link>
          <Link
            href="/"
            className="rounded-full border border-ink-line px-6 py-3 text-sm transition-colors hover:border-paper-faint"
          >
            Pagina principală
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
