import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/ArticleBody";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ARTICLES, getArticle, sortedArticles } from "@/lib/articles";
import { articleLesson } from "@/lib/program";
import { SITE, canonical } from "@/lib/site";

/** Toate articolele sunt cunoscute la build: se pot genera static. */
export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata(
  props: PageProps<"/articole/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const article = getArticle(slug);

  if (!article) return { title: "Articol inexistent" };

  const url = canonical(`/articole/${article.slug}`);

  return {
    title: article.metaTitle,
    description: article.description,
    keywords: [...article.keywords],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.metaTitle,
      description: article.description,
      publishedTime: article.published,
      modifiedTime: article.updated,
      siteName: SITE.name,
      locale: SITE.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.description,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticolPage(
  props: PageProps<"/articole/[slug]">,
) {
  const { slug } = await props.params;
  const article = getArticle(slug);

  if (!article) notFound();

  const others = sortedArticles()
    .filter((a) => a.slug !== article.slug)
    .slice(0, 2);

  // Date structurate pentru motoarele de căutare: fără ele, articolul apare ca
  // pagină oarecare, nu ca text cu autor și dată.
  const lesson = articleLesson(article.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.metaTitle,
        description: article.description,
        datePublished: article.published,
        dateModified: article.updated,
        inLanguage: "ro-RO",
        mainEntityOfPage: canonical(`/articole/${article.slug}`),
        author: { "@type": "Organization", name: SITE.name, url: SITE.url },
        publisher: { "@id": `${SITE.url}#organization` },
        keywords: article.keywords.join(", "),
        wordCount: article.body.reduce(
          (n, b) => n + ("text" in b ? String(b.text).split(/\s+/).length : 0),
          0,
        ),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: SITE.url },
          {
            "@type": "ListItem",
            position: 2,
            name: "Articole",
            item: canonical("/articole"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: canonical(`/articole/${article.slug}`),
          },
        ],
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

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <Link
          href="/articole"
          className="text-sm text-paper-faint hover:text-paper-dim"
        >
          ← Toate articolele
        </Link>

        <article className="mt-8">
          <p className="text-xs text-paper-faint">
            {formatDate(article.published)} · {article.readingMinutes} min de
            citit
          </p>

          <h1 className="mt-3 font-serif text-4xl leading-[1.15] text-balance sm:text-5xl">
            {article.title}
          </h1>

          <p className="mt-6 border-l-2 border-ink-line pl-5 text-lg leading-relaxed text-paper">
            {article.lede}
          </p>

          <ArticleBody body={article.body} />
        </article>

        {lesson && (
          <aside className="mt-12 rounded-2xl border border-[color:var(--value)]/30 p-6">
            <p className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              Lecția potrivită
            </p>
            <Link
              href={`/program/${lesson.guide.id}`}
              className="mt-2 block font-serif text-xl text-paper hover:underline"
            >
              Lecția {lesson.number} · {lesson.guide.title}
            </Link>
            <p className="mt-2 text-sm leading-relaxed text-paper-dim">
              {lesson.guide.summary}
            </p>
            <p className="mt-2 text-xs text-paper-faint">
              {lesson.guide.steps.length} pași · din{" "}
              <Link href="/program" className="underline underline-offset-4">
                programul de 12 lecții
              </Link>
            </p>
          </aside>
        )}

        <aside className="mt-8 rounded-2xl border border-ink-line p-8">
          <h2 className="font-serif text-2xl leading-snug">
            Tiparele tale, nu tiparele în general
          </h2>
          <p className="mt-3 max-w-lg leading-relaxed text-paper-dim">
            Articolul de mai sus e despre oameni în general. {SITE.name}{" "}
            lucrează cu ce spui tu: convingerile ies din propriile tale cuvinte,
            cu citatul din care au fost deduse. Lecția introductivă e gratuită.
          </p>
          <Link
            href="/intra"
            className="mt-6 inline-block rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Începe harta ta
          </Link>
        </aside>

        {others.length > 0 && (
          <section className="mt-16">
            <h2 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              De citit mai departe
            </h2>
            <ul className="mt-5 space-y-5">
              {others.map((other) => (
                <li key={other.slug} className="border-t border-ink-line pt-5">
                  <Link
                    href={`/articole/${other.slug}`}
                    className="group block"
                  >
                    <h3 className="font-serif text-xl text-paper transition-colors group-hover:text-[color:var(--belief)]">
                      {other.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-paper-dim">
                      {other.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
