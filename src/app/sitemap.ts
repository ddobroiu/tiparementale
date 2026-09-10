import type { MetadataRoute } from "next";

import { ARTICLES } from "@/lib/articles";
import { LESSONS } from "@/lib/program";
import { SITE } from "@/lib/site";

/** Paginile publice. Cele private nu au ce căuta într-o hartă a site-ului. */
const STATIC: Array<{
  path: string;
  priority: number;
  changeFrequency: "monthly" | "weekly" | "yearly";
}> = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/cum-functioneaza", priority: 0.9, changeFrequency: "monthly" },
  { path: "/program", priority: 0.9, changeFrequency: "monthly" },
  { path: "/pachete", priority: 0.9, changeFrequency: "monthly" },
  { path: "/articole", priority: 0.8, changeFrequency: "weekly" },
  { path: "/intrebari", priority: 0.7, changeFrequency: "monthly" },
  { path: "/despre", priority: 0.6, changeFrequency: "yearly" },
  { path: "/confidentialitate", priority: 0.3, changeFrequency: "yearly" },
  { path: "/termeni", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...STATIC.map((page) => ({
      url: new URL(page.path, SITE.url).toString(),
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...LESSONS.map((l) => ({
      url: new URL(`/program/${l.guide.id}`, SITE.url).toString(),
      lastModified: now,
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
