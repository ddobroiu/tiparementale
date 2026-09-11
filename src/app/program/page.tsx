import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LESSONS, MODULES, lessonMinutes } from "@/lib/program";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Programul: 12 lecții ghidate despre convingerile tale",
  description:
    "Douăsprezece lecții în cinci module — casa în care ai crescut, mama, tata, " +
    "rușinea, banii, munca, relațiile, rolul de părinte. Conversații ghidate, " +
    "construite pe terapia schemelor, în ordine: fiecare lecție o deschide pe " +
    "următoarea. O lecție = o ședință.",
  alternates: { canonical: canonical("/program") },
  openGraph: {
    type: "website",
    url: canonical("/program"),
    title: "Programul Tipare Mentale: 12 lecții ghidate",
    description:
      "Cinci module, douăsprezece lecții, una după alta. Din ce povestești, harta " +
      "convingerilor tale se umple.",
    siteName: SITE.name,
    locale: SITE.locale,
  },
};

/**
 * Programul, public: ce lecții există, ce caută fiecare, cât durează. Cine
 * ajunge aici din căutare înțelege ce cumpără înainte de a-și face cont.
 */
export default function ProgramPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: SITE.url },
          {
            "@type": "ListItem",
            position: 2,
            name: "Program",
            item: canonical("/program"),
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Programul Tipare Mentale",
        description: metadata.description,
        numberOfItems: LESSONS.length,
        itemListElement: LESSONS.map((l) => ({
          "@type": "ListItem",
          position: l.number,
          name: l.guide.title,
          url: canonical(`/program/${l.guide.id}`),
        })),
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
        <p className="text-xs tracking-[0.2em] text-paper-faint uppercase">
          Programul
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-balance sm:text-5xl">
          Douăsprezece lecții, una după alta.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-paper-dim">
          Fiecare lecție e o conversație ghidată de cinci-șase pași, pe o temă
          care formează convingeri: casa în care ai crescut, părinții, greșeala,
          rușinea, banii, munca, relațiile, copiii. Nu e un chestionar:
          întrebările se scriu în conversație, din ce spui. Din răspunsuri,
          harta ta se umple.
        </p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["O lecție = o ședință", "Până la 25 de replici. Fără cronometru."],
            [
              "Pe rând",
              "Lecția următoare se deschide când ai terminat-o pe cea dinainte.",
            ],
            [
              "Se reia",
              "O lecție lăsată la jumătate se continuă de unde a rămas.",
            ],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-ink-line p-5">
              <dt className="text-sm text-paper">{t}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-paper-faint">
                {d}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 space-y-12">
          {MODULES.map((module, mi) => {
            const lessons = LESSONS.filter((l) => l.moduleId === module.id);
            return (
              <section key={module.id}>
                <p className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: module.color }}
                  />
                  <span style={{ color: module.color }}>Modulul {mi + 1}</span>
                </p>
                <h2 className="mt-2 font-serif text-3xl text-paper">
                  {module.title}
                </h2>
                <p className="mt-2 max-w-xl leading-relaxed text-paper-dim">
                  {module.lead}
                </p>

                <ol className="mt-6 grid gap-3 sm:grid-cols-2">
                  {lessons.map((l) => (
                    <li key={l.guide.id}>
                      <Link
                        href={`/program/${l.guide.id}`}
                        className="group flex h-full gap-4 rounded-2xl border border-ink-line p-5 transition-colors hover:border-paper-faint"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm"
                          style={{
                            borderColor: module.color,
                            color: module.color,
                          }}
                        >
                          {l.number}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: module.color }}
                            />
                            <span className="font-serif text-lg leading-snug text-paper transition-colors group-hover:text-[color:var(--belief)]">
                              {l.guide.title}
                            </span>
                          </span>
                          <span className="mt-2 block text-sm leading-relaxed text-paper-dim">
                            {l.guide.summary}
                          </span>
                          <span className="mt-3 block text-xs text-paper-faint">
                            {l.guide.steps.length} pași · ~
                            {lessonMinutes(l.guide)} min
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>

        <div className="mt-16 rounded-2xl border border-ink-line p-8">
          <h2 className="font-serif text-2xl">Prima lecție e gratuită</h2>
          <p className="mt-3 max-w-lg leading-relaxed text-paper-dim">
            Îți faci cont, începi cu prima lecție de pe drum și vezi harta
            formându-se din ce spui. Fără card. Apoi, programe de la 149 lei,
            care nu expiră.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/intra"
              style={{ background: "var(--step)" }}
              className="rounded-full px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
            >
              Începe harta ta
            </Link>
            <Link
              href="/pachete"
              className="rounded-full border border-ink-line px-6 py-3 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
            >
              Vezi pachetele
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
