import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cum funcționează",
  description:
    "Identificare, interpretare, transformare. Cum se construiește harta " +
    "convingerilor tale din propriile cuvinte și ce faci cu ea mai departe.",
  alternates: { canonical: canonical("/cum-functioneaza") },
};

const STEPS = [
  {
    n: "01",
    title: "Identificare",
    body:
      "O ședință pe o temă ghidată — casa în care ai crescut, părinții, banii, " +
      "relațiile, munca, rolul de părinte. Ți se pune o singură întrebare pe " +
      "replică, poți răspunde liber sau alege dintre variante, și se sapă în " +
      "răspuns înainte de a se trece mai departe. Convingerile ies din " +
      "întâmplări, nu din declarații generale.",
    detail:
      "Fiecare element extras păstrează citatul exact din care a fost dedus, cu " +
      "data. Nimic nu apare pe hartă fără dovadă în propriile tale cuvinte.",
  },
  {
    n: "02",
    title: "Interpretare",
    body:
      "Harta se construiește pe ramuri — bani, relații, sănătate, muncă, familie, " +
      "copii, sine, sens. Tu confirmi, reformulezi sau respingi fiecare " +
      "element. Ceri o citire de ansamblu, care spune ce leagă între ele " +
      "punctele, și predicții de comportament la care răspunzi dacă te regăsești.",
    detail:
      "Aici devine precisă. Ce confirmi capătă contur plin și poate fi lucrat. Ce " +
      "respingi dispare și nu se mai propune, sub nicio formulare.",
  },
  {
    n: "03",
    title: "Transformare",
    body:
      "Pentru convingerile confirmate, primești o convingere nouă care să le ia " +
      "locul — nu negația celei vechi, fiindcă nimeni nu trăiește după o negație, " +
      "ci varianta pe care ai putea-o crede de mâine.",
    detail:
      "Împreună cu ea: de ce s-a instalat cea veche și ce a protejat, exerciții " +
      "cu pași clari pe care le bifezi când le faci, exemple concrete, o carte și " +
      "un film alese pentru convingerea aceea anume. Când o simți ca a ta, o " +
      "marchezi rezolvată: pe hartă devine verde.",
  },
];

export default function CumFunctioneazaPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <h1 className="font-serif text-4xl leading-tight text-balance sm:text-5xl">
          Cum funcționează
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper-dim">
          Conversația este metoda. Harta și felul în care se schimbă sunt lucrul
          de valoare.
        </p>

        <div className="mt-14 space-y-14">
          {STEPS.map((step) => (
            <section key={step.n} className="border-l border-ink-line pl-6">
              <span className="text-xs tracking-[0.2em] text-paper-faint">
                {step.n}
              </span>
              <h2 className="mt-2 font-serif text-3xl text-paper">
                {step.title}
              </h2>
              <p className="mt-4 leading-relaxed text-paper-dim">{step.body}</p>
              <p className="mt-4 text-sm leading-relaxed text-paper-faint italic">
                {step.detail}
              </p>
            </section>
          ))}
        </div>

        <section className="mt-16 border-t border-ink-line pt-10">
          <h2 className="font-serif text-2xl leading-snug">
            Cele douăsprezece lecții
          </h2>
          <p className="mt-4 leading-relaxed text-paper-dim">
            Identificarea se face pe lecții: conversații ghidate de cinci-șase
            pași, în cinci module — rădăcini, sinele, relațiile, bani și muncă,
            ca părinte. Le faci pe rând: fiecare o deschide pe următoarea, pentru
            că fiecare se sprijină pe ce a ieșit înainte. O lecție costă o
            ședință. Dacă nu vrei o lecție anume, vorbești liber.
          </p>
          <Link
            href="/program"
            className="mt-4 inline-block text-sm text-paper-dim underline underline-offset-4 hover:text-paper"
          >
            Vezi programul complet →
          </Link>
        </section>

        <section className="mt-16 border-t border-ink-line pt-10">
          <h2 className="font-serif text-2xl leading-snug">Ce nu face</h2>
          <ul className="mt-5 space-y-3 text-paper-dim">
            <li>Nu pune diagnostic și nu tratează nimic.</li>
            <li>Nu îți recită harta în conversație — harta se vede singură.</li>
            <li>Nu dă sfaturi nesolicitate în timpul discuției.</li>
            <li>
              Nu recomandă nimic pe baza unui tipar pe care nu l-ai confirmat.
            </li>
          </ul>
        </section>

        <div className="mt-14 rounded-2xl border border-ink-line p-8">
          <h2 className="font-serif text-2xl">Lecția introductivă e gratuită</h2>
          <p className="mt-3 max-w-lg leading-relaxed text-paper-dim">
            Zece minute despre un singur lucru pe care îl faci mereu, deși te
            costă. Suficient cât să vezi prima ta convingere apărând pe hartă.
            Fără card și fără abonament.
          </p>
          <Link
            href="/intra"
            className="mt-6 inline-block rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Începe harta ta
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
