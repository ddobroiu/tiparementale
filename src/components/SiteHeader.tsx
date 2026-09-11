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
                style={active ? { color: item.color } : undefined}
                className={`relative py-1 text-sm transition-colors ${
                  active ? "" : "text-paper-dim hover:text-paper"
                }`}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full"
                    style={{ background: item.color }}
                  />
                )}
              </Link>
            );
          })}
          <Link
            href="/harta"
            style={{ background: "var(--step)" }}
            className="rounded-full px-4 py-1.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Harta mea
          </Link>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="-mr-2 flex h-11 items-center gap-2 rounded-xl px-3 text-paper-dim md:hidden"
          aria-label={open ? "Închide meniul" : "Deschide meniul"}
          aria-expanded={open}
        >
          <span className="text-sm">{open ? "Închide" : "Meniu"}</span>
          <span className="text-xl leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <nav className="border-t border-ink-line px-6 py-3 md:hidden">
          <ul className="divide-y divide-ink-line">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    style={active ? { color: item.color } : undefined}
                    className={`flex items-center gap-2.5 py-3.5 text-base ${
                      active ? "" : "text-paper-dim"
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background: item.color,
                        opacity: active ? 1 : 0.45,
                      }}
                    />
                    {item.label}
                    <span className="ml-auto text-paper-faint">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/harta"
            onClick={() => setOpen(false)}
            style={{ background: "var(--step)" }}
            className="mt-4 block rounded-xl px-4 py-3.5 text-center text-base font-medium text-ink"
          >
            Harta mea
          </Link>
        </nav>
      )}
    </header>
  );
}
