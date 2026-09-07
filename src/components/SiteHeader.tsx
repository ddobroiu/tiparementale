"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "./Logo";
import { NAV } from "@/lib/site";

/**
 * Antetul site-ului public.
 *
 * Pe telefon meniul se pliază, fiindcă patru legături plus butonul nu încap pe
 * un rând fără să devină ilizibile. Pagina curentă rămâne marcată: fără ea,
 * omul nu știe unde se află într-un site cu mai multe secțiuni.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-line bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  active ? "text-paper" : "text-paper-dim hover:text-paper"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/harta"
            className="rounded-full bg-paper px-4 py-1.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Harta mea
          </Link>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="text-paper-dim md:hidden"
          aria-label={open ? "Închide meniul" : "Deschide meniul"}
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="border-t border-ink-line px-6 py-4 md:hidden">
          <ul className="space-y-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-paper-dim"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/harta"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-xl bg-paper px-4 py-2.5 text-center text-sm font-medium text-ink"
          >
            Harta mea
          </Link>
        </nav>
      )}
    </header>
  );
}
