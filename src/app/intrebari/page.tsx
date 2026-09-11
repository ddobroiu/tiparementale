import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { FAQ } from "@/lib/faq";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Întrebări frecvente",
  description:
    "Ce este Tipare Mentale, cum funcționează cele 12 lecții, cât costă, ce se " +
    "întâmplă cu datele tale și de ce nu este terapie.",
  alternates: { canonical: canonical("/intrebari") },
};


export default function IntrebariPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ro-RO",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <h1 className="font-serif text-4xl leading-tight text-balance sm:text-5xl">
          Întrebări frecvente
        </h1>

        <dl className="mt-12 space-y-8">
          {FAQ.map((item) => (
            <div key={item.q} className="border-t border-ink-line pt-8">
              <dt className="font-serif text-xl leading-snug text-paper">
                {item.q}
              </dt>
              <dd className="mt-3 leading-relaxed text-paper-dim">{item.a}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 rounded-2xl border border-ink-line p-8">
          <h2 className="font-serif text-2xl">Altă întrebare?</h2>
          <p className="mt-3 leading-relaxed text-paper-dim">
            Scrie-ne la{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="text-paper hover:underline"
            >
              {SITE.email}
            </a>
            . Răspundem.
          </p>
          <Link
            href="/intra"
            style={{ background: "var(--step)" }}
            className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Începe harta ta
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
