import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { CookieBanner } from "@/components/CookieBanner";
import { MetaPixel } from "@/components/MetaPixel";
import { SITE } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

/**
 * `metadataBase` face ca toate adresele relative din paginile copil să devină
 * absolute. Fără el, etichetele de partajare indică spre nicăieri, iar
 * adresele canonice sunt ignorate.
 */
/**
 * `viewportFit: cover` lasă pagina să ajungă până sub marginile rotunjite
 * ale telefonului; zonele sigure le tratăm noi, cu `env(safe-area-inset-*)`.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Android: tastatura micșorează fereastra paginii, nu o acoperă. Așa
  // `dvh` și foile fixate jos rămân deasupra ei fără cod în plus.
  interactiveWidget: "resizes-content",
  themeColor: "#0a1424",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "health",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: false },
  // Codul din Search Console, când există; altfel nu scriem nimic.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

/** Identitatea site-ului, pentru motoarele de căutare. */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}#organization`,
      name: SITE.name,
      url: SITE.url,
      email: SITE.email,
      description: SITE.description,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}#website`,
      url: SITE.url,
      name: SITE.name,
      inLanguage: "ro-RO",
      publisher: { "@id": `${SITE.url}#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE.url}#app`,
      name: SITE.name,
      url: SITE.url,
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      inLanguage: "ro-RO",
      description: SITE.description,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "RON",
        lowPrice: "0",
        highPrice: "599",
        offerCount: 4,
        description: "Prima ședință gratuită; programe de la 149 lei, fără abonament.",
      },
      publisher: { "@id": `${SITE.url}#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro">
      <body className={`${inter.variable} ${fraunces.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
        {/* Pixelul Meta se încarcă doar după „Accept" din banner. */}
        <MetaPixel />
        <CookieBanner />
      </body>
    </html>
  );
}
