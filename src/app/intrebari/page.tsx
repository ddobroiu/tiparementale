import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Întrebări frecvente",
  description:
    "Ce este Tipare Mentale, cum funcționează cele 12 lecții, cât costă, ce se " +
    "întâmplă cu datele tale și de ce nu este terapie.",
  alternates: { canonical: canonical("/intrebari") },
};

const FAQ = [
  {
    q: "Ce este, mai exact?",
    a:
      "Un instrument de auto-observație. Vorbești liber, iar din cuvintele tale " +
      "sunt extrase convingerile, valorile, temerile și tiparele care îți conduc " +
      "reacțiile. Ele se așază pe o hartă care crește în timp și pe care o poți " +
      "corecta. Pentru convingerile pe care le confirmi, primești o convingere " +
      "nouă și exerciții concrete prin care s-o exersezi.",
  },
  {
    q: "Este terapie?",
    a:
      "Nu. Nu punem diagnostic, nu tratăm și nu înlocuim un psihoterapeut. Este " +
      "un instrument de observație a propriilor tipare, util pentru lucruri care " +
      "te încurcă în viața de zi cu zi. Dacă treci prin depresie, anxietate care " +
      "îți limitează funcționarea, traumă sau ai gânduri de a-ți face rău, ai " +
      "nevoie de un specialist.",
  },
  {
    q: "De unde știe aplicația ce cred eu?",
    a:
      "Nu ghicește. Fiecare element de pe hartă păstrează citatul exact din care " +
      "a fost dedus, cu data. Poți deschide orice nod și vezi propriile tale " +
      "cuvinte. Dacă interpretarea e greșită, o respingi sau o reformulezi cu " +
      "cuvintele tale, iar ea nu se mai propune.",
  },
  {
    q: "Ce sunt lecțiile?",
    a:
      "Conversații ghidate de cinci-șase pași, pe o temă care formează convingeri: " +
      "casa în care ai crescut, mama, tata, ce se întâmpla când greșeai, rușinea, " +
      "banii, munca, relațiile, rolul de părinte. Sunt douăsprezece, în cinci module, " +
      "construite pe terapia schemelor. Întrebările nu se citesc de pe listă: se " +
      "scriu în conversație, din ce ai spus înainte.",
  },
  {
    q: "Trebuie să fac lecțiile în ordine?",
    a:
      "Nu. Ordinea din program e o recomandare — de la rădăcini spre ce faci azi — " +
      "nu o condiție. Orice lecție se poate începe oricând, cu o ședință. Poți " +
      "vorbi și liber, fără temă, tot cu o ședință. O lecție lăsată la jumătate se " +
      "reia de unde a rămas, fără să plătești altă ședință.",
  },
  {
    q: "Cât costă?",
    a:
      "Prima ședință este gratuită — orice lecție sau o conversație liberă — ca " +
      "să vezi ce cumperi. După ea, lucrezi pe programe: „Un tipar” (4 ședințe și 2 " +
      "transformări, 149 lei), „Harta completă” (12 ședințe, 6 transformări, " +
      "349 lei) sau „Însoțire 3 luni” (24 ședințe, 12 transformări, 599 lei). " +
      "Programele nu expiră, nu există abonament și nu se reînnoiește nimic automat.",
  },
  {
    q: "Cât durează o ședință?",
    a:
      "O ședință înseamnă până la 25 de replici. În practică, între zece și " +
      "treizeci de minute, în funcție de cât scrii. Nu are cronometru: se încheie " +
      "când termini replicile, nu când trece timpul.",
  },
  {
    q: "Ce se întâmplă cu ce scriu?",
    a:
      "Rămâne al tău. Datele sunt izolate pe utilizator la nivelul bazei de date, " +
      "nu doar în cod, iar conversațiile nu sunt citite de nimeni și nu sunt " +
      "folosite pentru antrenarea unor modele. Poți cere oricând exportul complet " +
      "sau ștergerea totală a contului.",
  },
  {
    q: "Pot să șterg tot?",
    a:
      "Da. Ștergerea contului elimină definitiv conversațiile, harta, citatele și " +
      "istoricul. Nu păstrăm copii.",
  },
  {
    q: "Trebuie să vorbesc despre lucruri grele?",
    a:
      "Nu. Poți vorbi despre ce ți se pare banal — o zi obișnuită, o iritare " +
      "măruntă, o amânare. Convingerile ies mai bine din întâmplări obișnuite " +
      "decât din declarații mari.",
  },
];

export default function IntrebariPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ro-RO",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <h1 className="font-serif text-4xl leading-tight text-balance sm:text-5xl">
          Întrebări frecvente
        </h1>

        <dl className="mt-12 space-y-8">
          {FAQ.map((item) => (
            <div key={item.q} className="border-t border-ink-line pt-8">
              <dt className="font-serif text-xl leading-snug text-paper">
                {item.q}
              </dt>
              <dd className="mt-3 leading-relaxed text-paper-dim">{item.a}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 rounded-2xl border border-ink-line p-8">
          <h2 className="font-serif text-2xl">Altă întrebare?</h2>
          <p className="mt-3 leading-relaxed text-paper-dim">
            Scrie-ne la{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="text-paper hover:underline"
            >
              {SITE.email}
            </a>
            . Răspundem.
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
