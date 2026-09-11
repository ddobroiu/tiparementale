import type { Metadata } from "next";

import { BuyButton } from "@/components/BuyButton";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TrackEvent } from "@/components/TrackEvent";
import { getSessionUser } from "@/lib/auth";
import { getWallet } from "@/lib/billing/entitlement";
import { listPacks } from "@/lib/billing/packs";
import { withUser } from "@/lib/db";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pachete și prețuri",
  description:
    "Prima ședință e gratuită. Apoi programe care nu expiră: Un tipar (149 lei), " +
    "Harta completă (349 lei), Însoțire 3 luni (599 lei). Ședințe pe cele 12 " +
    "lecții ale drumului, transformări cu exerciții, fără abonament.",
  alternates: { canonical: canonical("/pachete") },
};

/**
 * Ce e diferit între pachete, dincolo de numere. Cheia e codul pachetului din
 * bază, nu poziția în listă: dacă se schimbă ordinea sau apare unul nou,
 * pagina nu începe să mintă. Un pachet necunoscut primește culoarea neutră și
 * rândurile comune — nimic nu se rupe.
 */
const PACKS: Record<
  string,
  { color: string; fit: string; covers: string; recommended?: boolean }
> = {
  "un-tipar": {
    color: "#7cc4fb",
    fit: "Pentru un singur tipar, dus până la capăt.",
    covers: "Primele patru lecții de pe drum: casa în care ai crescut, mama, tata și ce aveai voie să simți.",
  },
  "harta-completa": {
    color: "#f6d186",
    recommended: true,
    fit: "Pentru harta întreagă, nu un colț din ea.",
    covers: "Exact cât are drumul: toate cele douăsprezece lecții, de la rădăcini până la ce transmiți copiilor.",
  },
  "insotire-3-luni": {
    color: "#c8b6ff",
    fit: "Pentru cine vrea să lucreze pe fiecare tipar, nu doar să-l vadă.",
    covers: "Tot drumul, cele douăsprezece lecții — și o transformare pentru fiecare: la fiecare pas, o convingere nouă în locul celei vechi.",
  },
};

const NEUTRAL = { color: "#a7b5cb", fit: "", covers: "" };

export default async function PachetePage() {
  const [packs, user] = await Promise.all([listPacks(), getSessionUser()]);

  const wallet = user
    ? await withUser(user.id, (client) => getWallet(client, user.id))
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Pachete Tipare Mentale",
    itemListElement: packs.map((pack, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: `${pack.name} — ${SITE.name}`,
        description: `${pack.sessions} ședințe și ${pack.transformations} transformări. Nu expiră.`,
        brand: { "@type": "Brand", name: SITE.name },
        offers: {
          "@type": "Offer",
          price: pack.priceRon.toFixed(2),
          priceCurrency: "RON",
          availability: "https://schema.org/InStock",
          url: canonical("/pachete"),
        },
      },
    })),
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackEvent
        name="ViewContent"
        params={{
          content_name: "pachete",
          content_type: "product",
          content_ids: packs.map((p) => p.code),
          currency: "RON",
        }}
      />
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-6 pt-10 pb-20 sm:pt-16">
        <h1 className="font-serif text-3xl leading-tight text-balance sm:text-5xl">
          Un program pe o convingere, nu minute de chat.
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-paper-dim">
          Ghiduri construite pe terapia schemelor, predicții pe care le confirmi
          sau le respingi, o convingere nouă cu exerciții urmărite în timp, și
          citirea hărții. Programele se cumpără o dată și{" "}
          <span className="text-paper">nu expiră niciodată</span> — nimeni nu
          lucrează la sine uniform, câte patru ședințe pe lună.
        </p>

        {wallet && (
          <p className="mt-6 inline-block rounded-full border border-[color:var(--ok)]/40 bg-[color:var(--ok)]/10 px-4 py-2 text-sm text-paper-dim">
            Ai acum{" "}
            <span className="text-paper">
              {wallet.sessionsLeft}{" "}
              {wallet.sessionsLeft === 1 ? "ședință" : "ședințe"}
            </span>{" "}
            și {wallet.transformationsLeft}{" "}
            {wallet.transformationsLeft === 1 ? "transformare" : "transformări"}
          </p>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {packs.map((pack) => {
            const style = PACKS[pack.code] ?? NEUTRAL;
            const best = Boolean(PACKS[pack.code]?.recommended);
            return (
              <div
                key={pack.code}
                style={{ borderColor: best ? style.color : undefined }}
                className={`flex flex-col rounded-2xl border p-6 ${
                  best ? "bg-ink-soft/60" : "border-ink-line"
                }`}
              >
                {best ? (
                  <span
                    className="mb-3 self-start rounded-full px-3 py-1 text-[11px] font-medium text-ink"
                    style={{ background: style.color }}
                  >
                    Cel mai ales
                  </span>
                ) : (
                  <span
                    className="mb-3 h-1 w-10 rounded-full"
                    style={{ background: style.color }}
                  />
                )}

                <h2 className="font-serif text-xl" style={{ color: style.color }}>
                  {pack.name}
                </h2>
                {style.fit && (
                  <p className="mt-1 text-xs text-paper-faint">{style.fit}</p>
                )}

                <p className="mt-3 font-serif text-4xl">
                  {pack.priceRon.toFixed(0)}
                  <span className="ml-1 text-base text-paper-faint">lei</span>
                </p>
                <p className="mt-1 text-xs text-paper-faint">
                  {pack.transformations >= pack.sessions
                    ? "o transformare la fiecare lecție"
                    : `${(pack.priceRon / pack.sessions).toFixed(0)} lei pe ședință`}{" "}
                  · plată unică
                </p>

                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-paper-dim">
                  <li>
                    <span className="text-paper">{pack.sessions} ședințe</span>
                    {style.covers ? ` — ${style.covers}` : ""}
                  </li>
                  <li>
                    <span className="text-paper">
                      {pack.transformations} transformări
                    </span>
                    : convingere nouă, exerciții cu urmărire, carte, film
                  </li>
                  <li>Predicții „te regăsești?” și citirea hărții, nelimitate</li>
                  <li className="flex items-start gap-1.5 text-[color:var(--ok)]">
                    <span aria-hidden>✓</span> Harta rămâne a ta. Nu expiră
                    nimic.
                  </li>
                </ul>

                <BuyButton
                  pack={pack.code}
                  priceRon={pack.priceRon}
                  highlighted={best}
                  loggedIn={Boolean(user)}
                  color={style.color}
                />
              </div>
            );
          })}
        </div>

        <p className="mt-8 max-w-xl text-sm leading-relaxed text-paper-faint">
          O ședință înseamnă până la 25 de replici pe o temă, plus tot ce se
          adaugă în hartă din ele. O transformare îți dă o convingere nouă
          pentru un tipar confirmat, cu exerciții pe care le faci și le notezi
          în timp, exemple concrete, o carte și un film. Prima ședință și
          predicțiile sunt gratuite la crearea contului.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
