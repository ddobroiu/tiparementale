import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

/** Adăugat pe ecranul telefonului, site-ul se poartă ca o aplicație. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    lang: "ro",
    start_url: "/harta",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/simbol-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
