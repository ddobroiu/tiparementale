import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { sortedArticles } from "@/lib/articles";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Articole despre convingeri și tipare de gândire",
  description:
    "Texte despre convingeri limitative, perfecționism, relația cu banii și " +
    "tiparele care se repetă. Scrise ca să fie de folos, nu ca să umple pagina.",
  alternates: { canonical: canonical("/articole") },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ArticolePage() {
  const articles = sortedArticles();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <h1 className="font-serif text-4xl leading-tight text-balance sm:text-5xl">
          Despre convingeri și tiparele care le urmează
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-paper-dim">
          Texte scrise ca să fie de folos cuiva care încearcă să se înțeleagă pe
          sine. Fără promisiuni de vindecare și fără jargon.
        </p>

        <ul className="mt-12 space-y-8">
          {articles.map((article) => (
            <li key={article.slug} className="border-t border-ink-line pt-8">
              <Link href={`/articole/${article.slug}`} className="group block">
                <p className="text-xs text-paper-faint">
                  {formatDate(article.published)} · {article.readingMinutes} min de citit
                </p>
                <h2 className="mt-2 font-serif text-2xl leading-snug text-paper transition-colors group-hover:text-[color:var(--belief)]">
                  {article.title}
                </h2>
                <p className="mt-3 leading-relaxed text-paper-dim">{article.lede}</p>
                <span className="mt-3 inline-block text-sm text-paper-faint">
                  Citește →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-16 rounded-2xl border border-ink-line p-8">
          <h2 className="font-serif text-2xl leading-snug">
            Cititul ajută. Să te vezi pe tine ajută mai mult.
          </h2>
          <p className="mt-3 max-w-lg leading-relaxed text-paper-dim">
            {SITE.name} construiește harta convingerilor tale din ce spui, nu din
            teorie generală. Prima ședință este gratuită.
          </p>
          <Link
            href="/intra"
            className="mt-6 inline-block rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Începe harta ta
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
