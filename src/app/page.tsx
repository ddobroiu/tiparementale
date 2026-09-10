import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LandingSteps } from "@/components/LandingSteps";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { sortedArticles } from "@/lib/articles";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  keywords: [
    "convingeri limitative",
    "tipare de gandire",
    "harta mentala",
    "auto-cunoastere",
    "dezvoltare personala",
    "perfectionism",
    "convingeri despre bani",
  ],
  alternates: { canonical: canonical("/") },
};

export default function Home() {
  const articles = sortedArticles().slice(0, 3);

  return (
    <>
      <SiteHeader />

      <main>
        <section className="mx-auto flex max-w-6xl items-center gap-10 px-6 pt-14 pb-8 sm:pt-24">
          <div className="min-w-0 flex-1">
            <h1 className="max-w-3xl font-serif text-4xl leading-[1.1] tracking-tight text-balance sm:text-6xl">
              O hartă vie a felului în care gândești.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper-dim">
              Vorbește liber. Convingerile care îți conduc reacțiile — despre
              bani, relații, muncă, tine însuți — devin vizibile, se leagă între
              ele și se schimbă în timp, sub ochii tăi.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/intra"
                className="rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
              >
                Începe harta ta — prima ședință e gratuită
              </Link>
              <Link
                href="/cum-functioneaza"
                className="text-sm text-paper-dim underline underline-offset-4 hover:text-paper"
              >
                Cum funcționează
              </Link>
            </div>
            <p className="mt-5 text-sm text-paper-faint">
              Nu este terapie. Este un instrument de auto-observație.
            </p>
          </div>

          {/* Ecusonul, în spațiul din dreapta al primului ecran. Pe telefon nu
              e loc: acolo rămâne în antet. */}
          <Image
            src="/logo-512.png"
            alt="Tipare Mentale — reprogramează-ți viața"
            width={360}
            height={360}
            priority
            className="hidden shrink-0 rounded-full shadow-[0_0_80px_rgba(216,179,106,0.18)] lg:block"
          />
        </section>

        <LandingSteps />

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="rounded-2xl border border-ink-line p-8 sm:p-14">
            <h2 className="max-w-2xl font-serif text-2xl leading-snug text-balance sm:text-3xl">
              Nu este un chatbot. Conversația e doar metoda — harta și felul în
              care se schimbă sunt lucrul de valoare.
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-paper-dim">
              Fiecare conversație se termină în hartă: vezi ce s-a adăugat, ce
              s-a întărit și ce s-a slăbit față de săptămâna trecută. Fiecare
              element păstrează citatul din care a fost dedus, deci poți
              verifica oricând de unde vine.
            </p>
            <Link
              href="/intra"
              className="mt-8 inline-block rounded-full border border-ink-line px-6 py-3 text-sm transition-colors hover:border-paper-faint"
            >
              Începe harta ta
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl sm:text-3xl">
              De citit între timp
            </h2>
            <Link
              href="/articole"
              className="shrink-0 text-sm text-paper-faint hover:text-paper-dim"
            >
              Toate articolele →
            </Link>
          </div>

          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/articole/${article.slug}`}
                  className="group block h-full rounded-2xl border border-ink-line p-6 transition-colors hover:border-paper-faint"
                >
                  <p className="text-xs text-paper-faint">
                    {article.readingMinutes} min de citit
                  </p>
                  <h3 className="mt-2 font-serif text-lg leading-snug text-paper transition-colors group-hover:text-[color:var(--belief)]">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-paper-dim">
                    {article.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
