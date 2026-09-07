import Link from "next/link";

import { Logo } from "./Logo";
import { FOOTER_LINKS, SITE } from "@/lib/site";

/**
 * Subsolul site-ului.
 *
 * Conține și mențiunea de criză. Nu este o formalitate juridică: cineva care
 * citește noaptea un articol despre convingeri poate fi exact omul care are
 * nevoie de numărul acela, iar subsolul e locul unde ajunge oricine derulează
 * până la capăt.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-ink-line">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper-faint">
              {SITE.tagline}. Un instrument de auto-observație — nu terapie și
              nu diagnostic.
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-paper-dim transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-ink-line pt-6">
          <p className="text-sm leading-relaxed text-paper-faint">
            Dacă treci printr-un moment greu, vorbește cu cineva. Telefonul
            Antisuicid:{" "}
            <a href="tel:0800801200" className="text-paper-dim hover:text-paper">
              0800 801 200
            </a>{" "}
            — gratuit, non-stop. Pentru copii și adolescenți, Telefonul Copilului:{" "}
            <a href="tel:116111" className="text-paper-dim hover:text-paper">
              116 111
            </a>
            .
          </p>

          <p className="mt-6 text-xs text-paper-faint">
            © {new Date().getFullYear()} {SITE.name}. Toate drepturile rezervate.
          </p>
        </div>
      </div>
    </footer>
  );
}
