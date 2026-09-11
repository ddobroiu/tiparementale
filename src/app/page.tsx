import type { Metadata } from "next";
import Link from "next/link";

import { LandingSteps } from "@/components/LandingSteps";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SpinningBadge } from "@/components/SpinningBadge";
import { FAQ_HOME } from "@/lib/faq";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  keywords: [
    "convingeri limitative",
    "tipare de gandire",
    "harta mentala",
    "auto-cunoastere",
    "dezvoltare personala",
    "terapia schemelor",
    "lectii ghidate",
    "perfectionism",
    "convingeri despre bani",
    "reprogramare mentala",
  ],
  alternates: { canonical: canonical("/") },
};

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="mx-auto flex max-w-6xl items-center gap-10 px-6 pt-14 pb-8 sm:pt-24">
          <div className="min-w-0 flex-1">
            <h1 className="max-w-3xl font-serif text-4xl leading-[1.1] tracking-tight text-balance sm:text-6xl">
              O hartă vie a felului în care gândești.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper-dim">
              Vorbește liber. Convingerile care îți conduc reacțiile — despre
              bani, relații, muncă, tine însuți — devin vizibile, se leagă între
              ele și se schimbă în timp, sub ochii tăi.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/intra"
                className="rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
              >
                Începe harta ta — prima ședință e gratuită
              </Link>
              <Link
                href="/cum-functioneaza"
                className="text-sm text-paper-dim underline underline-offset-4 hover:text-paper"
              >
                Cum funcționează
              </Link>
            </div>
            <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-paper-dim">
              {["Identificare", "Interpretare", "Transformare"].map(
                (step, i) => (
                  <span key={step} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-ink-line text-[11px] text-paper-faint">
                      {i + 1}
                    </span>
                    {step}
                    {i < 2 && <span className="text-paper-faint">→</span>}
                  </span>
                ),
              )}
            </p>
            <p className="mt-4 text-sm text-paper-faint">
              Nu este terapie. Este un instrument de auto-observație.
            </p>
          </div>

          {/* Ecusonul, în spațiul din dreapta al primului ecran: o monedă care se
              rotește și poate fi învârtită. Pe telefon nu e loc; acolo rămâne
              simbolul din antet. */}
          <div className="hidden lg:block">
            <SpinningBadge size={460} />
          </div>
        </section>

        <LandingSteps />

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="rounded-2xl border border-ink-line p-8 sm:p-14">
            <h2 className="max-w-2xl font-serif text-2xl leading-snug text-balance sm:text-3xl">
              Nu este un chatbot. Conversația e doar metoda — harta și felul în
              care se schimbă sunt lucrul de valoare.
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-paper-dim">
              Fiecare ședință se termină în hartă: vezi ce s-a adăugat, ce s-a
              întărit și ce s-a slăbit. Fiecare element păstrează citatul din
              care a fost dedus, deci poți verifica oricând de unde vine. Iar ce
              lucrezi se vede: convingerile în lucru au inel, cele rezolvate
              sunt verzi.
            </p>
            <Link
              href="/intra"
              className="mt-8 inline-block rounded-full border border-ink-line px-6 py-3 text-sm transition-colors hover:border-paper-faint"
            >
              Începe harta ta
            </Link>
          </div>
        </section>

        {/* Întrebările pe care le are oricine înainte să-și facă cont. Aici,
            nu într-o pagină separată din meniu: cine ezită nu pleacă să caute. */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl sm:text-3xl">
              Întrebări frecvente
            </h2>
            <Link
              href="/intrebari"
              className="shrink-0 text-sm text-paper-faint hover:text-paper-dim"
            >
              Toate întrebările →
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {FAQ_HOME.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-ink-line p-5 transition-colors open:border-[color:var(--step)]/60 hover:border-paper-faint"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg leading-snug text-paper [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="shrink-0 text-paper-faint transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
