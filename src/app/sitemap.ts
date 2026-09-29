import type { MetadataRoute } from "next";

import { ARTICLES } from "@/lib/articles";
import { LEGAL_VERSION } from "@/lib/legal";
import { LESSONS } from "@/lib/program";
import { SITE } from "@/lib/site";

type Freq = "monthly" | "weekly" | "yearly";

/** Data celui mai recent articol actualizat. */
const articlesUpdated = new Date(
  Math.max(...ARTICLES.map((a) => new Date(a.updated).getTime())),
);
/** Data versiunii în vigoare a documentelor legale. */
const legalUpdated = new Date(LEGAL_VERSION);

/**
 * Paginile publice. Cele private nu au ce căuta într-o hartă a site-ului.
 *
 * `lastModified` apare doar unde avem o dată reală (articole, documente
 * legale), nu momentul build-ului: o dată care se schimbă la fiecare deploy
 * fără ca pagina să se schimbe învață motoarele de căutare să o ignore.
 */
const STATIC: Array<{
  path: string;
  priority: number;
  changeFrequency: Freq;
  lastModified?: Date;
}> = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/cum-functioneaza", priority: 0.9, changeFrequency: "monthly" },
  { path: "/program", priority: 0.9, changeFrequency: "monthly" },
  { path: "/pachete", priority: 0.9, changeFrequency: "monthly" },
  { path: "/articole", priority: 0.8, changeFrequency: "weekly", lastModified: articlesUpdated },
  { path: "/intrebari", priority: 0.7, changeFrequency: "monthly" },
  { path: "/despre", priority: 0.6, changeFrequency: "yearly" },
  { path: "/confidentialitate", priority: 0.3, changeFrequency: "yearly", lastModified: legalUpdated },
  { path: "/termeni", priority: 0.3, changeFrequency: "yearly", lastModified: legalUpdated },
  { path: "/cookies", priority: 0.2, changeFrequency: "yearly", lastModified: legalUpdated },
  { path: "/contact", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC.map((page) => ({
      url: new URL(page.path, SITE.url).toString(),
      ...(page.lastModified ? { lastModified: page.lastModified } : {}),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...LESSONS.map((l) => ({
      url: new URL(`/program/${l.guide.id}`, SITE.url).toString(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...ARTICLES.map((article) => ({
      url: new URL(`/articole/${article.slug}`, SITE.url).toString(),
      lastModified: new Date(article.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
