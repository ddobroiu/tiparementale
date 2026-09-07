import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

/**
 * Zonele private nu sunt doar inutile pentru indexare, ci și dăunătoare:
 * o hartă personală ajunsă în rezultatele căutării ar fi o scurgere de date.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/harta", "/setari", "/intra", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
    host: SITE.url,
  };
}
