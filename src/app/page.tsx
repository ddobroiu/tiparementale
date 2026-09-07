import Link from "next/link";

import { LandingSteps } from "@/components/LandingSteps";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Link
          href="/intra"
          className="rounded-full border border-ink-line px-4 py-1.5 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
        >
          Intră
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-8 sm:pt-28">
        <h1 className="max-w-3xl font-serif text-4xl leading-[1.1] tracking-tight text-balance sm:text-6xl">
          O hartă vie a felului în care gândești.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper-dim">
          Vorbește liber. Tiparele tale — convingeri, valori, temeri, obiective —
          devin vizibile, se leagă între ele și se schimbă în timp, sub ochii tăi.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/intra"
            className="rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Începe harta ta
          </Link>
          <span className="text-sm text-paper-faint">
            Nu este terapie. Este un instrument de auto-observație.
          </span>
        </div>
      </section>

      <LandingSteps />

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="rounded-2xl border border-ink-line p-8 sm:p-14">
          <h2 className="max-w-2xl font-serif text-2xl leading-snug text-balance sm:text-3xl">
            Nu este un chatbot. Conversația e doar metoda — harta și felul în care
            se schimbă sunt lucrul de valoare.
          </h2>
          <p className="mt-5 max-w-xl leading-relaxed text-paper-dim">
            Fiecare conversație se termină în hartă: vezi ce s-a adăugat, ce s-a
            întărit și ce s-a slăbit față de săptămâna trecută.
          </p>
          <Link
            href="/intra"
            className="mt-8 inline-block rounded-full border border-ink-line px-6 py-3 text-sm transition-colors hover:border-paper-faint"
          >
            Începe harta ta
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-paper-faint">
          <Logo />
          <span>
            Dacă treci printr-un moment greu: Antisuicid 0800 801 200, gratuit, non-stop.
          </span>
        </div>
      </footer>
    </main>
  );
}
