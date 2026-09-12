import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Despre",
  description:
    "De ce există Tipare Mentale, ce credem despre auto-observație și unde ne " +
    "oprim în mod deliberat.",
  alternates: { canonical: canonical("/despre") },
};

export default function DesprePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <h1 className="font-serif text-4xl leading-tight text-balance sm:text-5xl">
          De ce există {SITE.name}
        </h1>

        <div className="mt-10 space-y-6 text-[17px] leading-[1.75] text-paper-dim">
          <p>
            Cei mai mulți oameni își cunosc reacțiile, dar nu și regulile din care
            vin. Știi că te enervezi când cineva întârzie, că amâni un lucru de
            luni de zile, că nu ceri niciodată ajutor. Ce nu se vede este
            propoziția care produce toate trei — pentru că nu sună a propoziție,
            sună a felul în care stau lucrurile.
          </p>
          <p>
            Instrumentele obișnuite nu ajută aici. Un jurnal păstrează
            întâmplările, dar nu le leagă. Un test de personalitate îți dă o
            etichetă, dar nu îți arată de unde vine. Un chatbot îți ține companie,
            dar conversația se evaporă odată cu fereastra.
          </p>
          <p>
            {SITE.name} face un singur lucru, dar îl face serios: transformă ce
            spui într-o hartă care rămâne, se leagă și se schimbă în timp. Nu
            conversația este produsul — harta este.
          </p>

          <h2 className="pt-6 font-serif text-2xl text-paper">În ce credem</h2>
          <p>
            <span className="text-paper">Nimic fără dovadă.</span> Fiecare element
            de pe harta ta păstrează citatul exact din care a fost dedus. Dacă nu
            putem arăta din ce cuvinte ale tale vine, nu are ce căuta acolo.
          </p>
          <p>
            <span className="text-paper">Tu ai ultimul cuvânt.</span> Sistemul
            propune, tu decizi. Ce respingi nu se mai propune, sub nicio
            formulare. Ce reformulezi cu cuvintele tale înlocuiește definitiv
            formularea noastră.
          </p>
          <p>
            <span className="text-paper">
              Convingerile restrictive nu sunt defecte de caracter.
            </span>{" "}
            Aproape toate au fost cândva soluții bune, care au protejat pe cineva
            într-un context care nu mai există. Le tratăm ca atare — altfel omul
            se apără de tine, pe bună dreptate.
          </p>
          <p>
            <span className="text-paper">
              Progresul se măsoară din ce spui, nu din ce declari că simți.
            </span>{" "}
            „Tiparul apărea de patru ori pe săptămână, acum apare o dată” sunt
            date. „Cum te simți de la 1 la 10” este altă aplicație.
          </p>

          <h2 className="pt-6 font-serif text-2xl text-paper">Unde ne oprim</h2>
          <p>
            Nu punem diagnostic. Nu tratăm. Nu înlocuim un psihoterapeut, și nu
            pretindem că am putea. Auto-observația e utilă pentru lucrurile care
            te încurcă în viața de zi cu zi; nu e suficientă pentru traumă,
            depresie sau anxietate care îți limitează funcționarea.
          </p>
          <p>
            Nu vindem certitudini. Un model care extrage convingeri din text poate
            greși, iar noi construim produsul plecând de la ipoteza că va greși —
            de aceea totul e verificabil, respingerea e la un click distanță, iar
            harta se corectează cu cuvintele tale.
          </p>
        </div>

        <div className="mt-14 rounded-2xl border border-ink-line p-8">
          <h2 className="font-serif text-2xl">Vezi singur</h2>
          <p className="mt-3 max-w-lg leading-relaxed text-paper-dim">
            Lecția introductivă e gratuită. Suficientă cât să vezi prima ta
            convingere apărând pe hartă, din ce spui.
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
