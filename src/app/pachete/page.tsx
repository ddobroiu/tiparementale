import Link from "next/link";

import { BuyButton } from "@/components/BuyButton";
import { Logo } from "@/components/Logo";
import { getSessionUser } from "@/lib/auth";
import { getWallet } from "@/lib/billing/entitlement";
import { listPacks } from "@/lib/billing/packs";
import { withUser } from "@/lib/db";

export const metadata = { title: "Pachete — Tipare Mentale" };

export default async function PachetePage() {
  const [packs, user] = await Promise.all([listPacks(), getSessionUser()]);

  const wallet = user
    ? await withUser(user.id, (client) => getWallet(client, user.id))
    : null;

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/">
          <Logo />
        </Link>
        <Link
          href={user ? "/harta" : "/intra"}
          className="rounded-full border border-ink-line px-4 py-1.5 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
        >
          {user ? "Harta mea" : "Intră"}
        </Link>
      </header>

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
          <p className="mt-6 inline-block rounded-full border border-ink-line px-4 py-2 text-sm text-paper-dim">
            Ai acum{" "}
            <span className="text-paper">
              {wallet.sessionsLeft} {wallet.sessionsLeft === 1 ? "ședință" : "ședințe"}
            </span>{" "}
            și {wallet.transformationsLeft}{" "}
            {wallet.transformationsLeft === 1 ? "transformare" : "transformări"}
          </p>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {packs.map((pack, i) => (
            <div
              key={pack.code}
              className={`flex flex-col rounded-2xl border p-6 ${
                i === 1 ? "border-paper-faint" : "border-ink-line"
              }`}
            >
              {i === 1 && (
                <span className="mb-3 self-start rounded-full bg-paper px-3 py-1 text-[11px] font-medium text-ink">
                  Cel mai ales
                </span>
              )}

              <h2 className="font-serif text-xl">{pack.name}</h2>

              <p className="mt-3 font-serif text-4xl">
                {pack.priceRon.toFixed(0)}
                <span className="ml-1 text-base text-paper-faint">lei</span>
              </p>
              <p className="mt-1 text-xs text-paper-faint">
                {(pack.priceRon / pack.sessions).toFixed(0)} lei pe ședință
              </p>

              <ul className="mt-5 flex-1 space-y-2 text-sm text-paper-dim">
                <li>
                  <span className="text-paper">{pack.sessions} ședințe</span> ghidate pe
                  teme — copilăria, părinții, banii, relațiile, munca și rolul de părinte
                </li>
                <li>
                  <span className="text-paper">{pack.transformations} transformări</span>:
                  convingere nouă, exerciții cu urmărire, carte, film
                </li>
                <li>Predicții „te regăsești?” și citirea hărții, nelimitate</li>
                <li>Harta rămâne a ta. Nu expiră nimic.</li>
              </ul>

              <BuyButton pack={pack.code} highlighted={i === 1} loggedIn={Boolean(user)} />
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-xl text-sm leading-relaxed text-paper-faint">
          O ședință înseamnă până la 25 de replici pe o temă, plus tot ce se
          adaugă în hartă din ele. O transformare îți dă o convingere nouă pentru
          un tipar confirmat, cu exerciții pe care le faci și le notezi în timp,
          exemple concrete, o carte și un film. Prima ședință și predicțiile sunt
          gratuite la crearea contului.
        </p>
      </section>
    </main>
  );
}
