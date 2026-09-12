import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getArticle } from "@/lib/articles";
import { LESSONS, MODULES, lessonArticles, lessonMinutes } from "@/lib/program";
import { SCHEMA_BY_CODE } from "@/lib/schemas";
import { SITE, canonical } from "@/lib/site";
import { DOMAIN_COLORS, DOMAIN_LABELS } from "@/lib/types";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ id: l.guide.id }));
}

export async function generateMetadata(
  props: PageProps<"/program/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const lesson = LESSONS.find((l) => l.guide.id === id);
  if (!lesson) return { title: "Lecție inexistentă" };

  const url = canonical(`/program/${id}`);
  const title = `${lesson.guide.title} — lecția ${lesson.number}`;
  return {
    title,
    description: lesson.guide.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description: lesson.guide.summary,
      siteName: SITE.name,
      locale: SITE.locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: lesson.guide.summary,
    },
  };
}

/**
 * O lecție, public: despre ce e, întrebările pe care le pune, tiparele pe
 * care le caută, sursele. Suficient cât omul să știe în ce intră; întrebarea
 * reală se scrie oricum în conversație, din ce spune el.
 */
export default async function LectiePage(props: PageProps<"/program/[id]">) {
  const { id } = await props.params;
  const index = LESSONS.findIndex((l) => l.guide.id === id);
  if (index < 0) notFound();

  const lesson = LESSONS[index];
  const { guide } = lesson;
  const mod = MODULES.find((m) => m.id === lesson.moduleId)!;
  const prev = LESSONS[index - 1] ?? null;
  const next = LESSONS[index + 1] ?? null;

  const schemas = [...new Set(guide.steps.flatMap((s) => s.schemas))]
    .map((code) => SCHEMA_BY_CODE.get(code))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const articles = lessonArticles(guide.id)
    .map(getArticle)
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const url = canonical(`/program/${guide.id}`);
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
          { "@type": "ListItem", position: 3, name: guide.title, item: url },
        ],
      },
      {
        "@type": "LearningResource",
        name: guide.title,
        description: guide.summary,
        url,
        inLanguage: "ro-RO",
        learningResourceType: "Conversație ghidată",
        timeRequired: `PT${lessonMinutes(guide)}M`,
        isPartOf: {
          "@type": "Course",
          name: "Programul Tipare Mentale",
          url: canonical("/program"),
        },
        provider: { "@id": `${SITE.url}#organization` },
        teaches: schemas.map((s) => s.name),
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

      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <nav aria-label="Ești aici" className="text-xs text-paper-faint">
          <Link href="/program" className="hover:text-paper-dim">
            Program
          </Link>
          <span className="mx-2">/</span>
          <span>{mod.title}</span>
        </nav>

        <p className="mt-6 flex items-center gap-2 text-xs tracking-[0.2em] text-paper-faint uppercase">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: DOMAIN_COLORS[guide.domain] }}
          />
          Lecția {lesson.number} · {DOMAIN_LABELS[guide.domain]}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-balance sm:text-5xl">
          {guide.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-paper-dim">
          {guide.summary}
        </p>
        <p className="mt-3 text-sm text-paper-faint">
          {guide.steps.length} pași · ~{lessonMinutes(guide)} minute · o ședință
        </p>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Pe unde trece conversația</h2>
          <p className="mt-2 text-sm leading-relaxed text-paper-faint">
            Acestea sunt întrebările de pornire ale fiecărui pas. În lecție,
            întrebarea reală se adaptează la ce ai spus înainte — se sapă în
            răspuns, nu se trece la următoarea de pe listă.
          </p>
          <ol className="mt-6 space-y-5">
            {guide.steps.map((step, i) => (
              <li key={step.id} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-line text-xs text-paper-faint">
                  {i + 1}
                </span>
                <div>
                  <p className="font-serif text-lg leading-snug text-paper">
                    {step.question}
                  </p>
                  {step.options && (
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {step.options.map((o) => (
                        <span
                          key={o}
                          className="rounded-full border border-ink-line px-2.5 py-0.5 text-xs text-paper-faint"
                        >
                          {o}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {schemas.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl">Tiparele pe care le caută</h2>
            <p className="mt-2 text-sm leading-relaxed text-paper-faint">
              Din cele optsprezece scheme descrise de Jeffrey Young. Nu ți le
              spunem în conversație; le vezi pe hartă, la fiecare element, ca
              „familia tiparului”.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {schemas.map((s) => (
                <li
                  key={s.code}
                  className="rounded-xl border border-ink-line p-4"
                >
                  <p className="text-sm text-paper">{s.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-paper-dim">
                    {s.essence}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Pe ce se sprijină</h2>
          <ul className="mt-4 space-y-1.5 text-sm text-paper-dim">
            {guide.sources.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        {articles.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl">De citit înainte</h2>
            <ul className="mt-4 space-y-2">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/articole/${a.slug}`}
                    className="text-paper-dim underline underline-offset-4 hover:text-paper"
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-14 rounded-2xl border border-ink-line p-8">
          <h2 className="font-serif text-2xl">Începe lecția</h2>
          <p className="mt-3 max-w-lg leading-relaxed text-paper-dim">
            Îți faci cont și începi cu lecția introductivă, gratuită. Apoi
            alegi un pachet și drumul se deschide, lecție după lecție — harta
            pornește din ce povestești.
          </p>
          <Link
            href="/intra"
            className="mt-6 inline-block rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Începe harta ta
          </Link>
        </div>

        <nav
          className="mt-10 flex justify-between gap-4 text-sm"
          aria-label="Lecții vecine"
        >
          {prev ? (
            <Link
              href={`/program/${prev.guide.id}`}
              className="text-paper-faint hover:text-paper-dim"
            >
              ← Lecția {prev.number}: {prev.guide.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/program/${next.guide.id}`}
              className="text-right text-paper-faint hover:text-paper-dim"
            >
              Lecția {next.number}: {next.guide.title} →
            </Link>
          )}
        </nav>
      </main>

      <SiteFooter />
    </>
  );
}
