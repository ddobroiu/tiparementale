import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  description:
    "Condițiile de utilizare a serviciului, ce cumperi exact, politica de " +
    "returnare și limitele serviciului.",
  alternates: { canonical: canonical("/termeni") },
};

const SECTIONS = [
  {
    title: "Ce este serviciul",
    paragraphs: [
      `${SITE.name} este un instrument digital de auto-observație. Pe baza conversațiilor purtate de utilizator, serviciul extrage și organizează tipare de gândire într-o reprezentare vizuală, și propune exerciții de lucru personal.`,
      "Serviciul nu constituie asistență medicală, psihologică sau psihiatrică. Nu pune diagnostic, nu tratează afecțiuni și nu înlocuiește consultul unui specialist. Conținutul generat are caracter informativ și de reflecție personală.",
    ],
  },
  {
    title: "Limite importante",
    paragraphs: [
      "Serviciul folosește modele de inteligență artificială. Interpretările propuse pot fi inexacte sau greșite. Utilizatorul are, în orice moment, posibilitatea de a confirma, reformula sau respinge orice interpretare, iar cele respinse nu mai sunt propuse.",
      "Recomandările de cărți și filme sunt generate automat. Deși solicităm indicarea autorului și a anului pentru verificabilitate, pot apărea inexactități. Utilizatorul poate marca orice recomandare drept incorectă.",
      "Dacă te confrunți cu o urgență de sănătate mintală sau ai gânduri de a-ți face rău, contactează serviciile de urgență (112) sau Telefonul Antisuicid (0800 801 200).",
    ],
  },
  {
    title: "Contul",
    paragraphs: [
      "Serviciul este destinat persoanelor de cel puțin 18 ani.",
      "Ești responsabil pentru păstrarea confidențialității parolei și pentru activitatea desfășurată prin contul tău.",
      "Îți poți șterge contul oricând. Ștergerea este definitivă.",
    ],
  },
  {
    title: "Ce cumperi",
    paragraphs: [
      "Ședințele se achiziționează în pachete, cu plată unică. Nu există abonament și nu se face nicio reînnoire automată.",
      "O ședință înseamnă o conversație de până la 25 de replici, împreună cu prelucrarea acesteia în hartă. O lucrare de transformare înseamnă generarea unei convingeri alternative pentru un element confirmat, cu exercițiile și recomandările aferente.",
      "Ședințele cumpărate nu expiră.",
      "Fiecare cont nou primește gratuit o ședință și o lucrare de transformare.",
    ],
  },
  {
    title: "Plăți și returnare",
    paragraphs: [
      "Plățile sunt procesate de Stripe. Prețurile sunt exprimate în lei și includ taxele aplicabile.",
      "Conform legislației privind contractele la distanță, ai dreptul de a te retrage în 14 zile. Întrucât serviciul este conținut digital furnizat imediat, prin efectuarea plății ești de acord cu începerea executării și îți exprimi acordul asupra pierderii dreptului de retragere pentru ședințele deja consumate.",
      "Ședințele neconsumate din orice pachet se rambursează integral, la cerere, în termen de 14 zile de la achiziție.",
      "Dacă o eroare tehnică a consumat o ședință fără să primești serviciul, o restituim. Scrie-ne.",
    ],
  },
  {
    title: "Proprietate",
    paragraphs: [
      "Conținutul pe care îl scrii îți aparține. Nu revendicăm niciun drept asupra lui și nu îl folosim în alt scop decât furnizarea serviciului către tine.",
      "Codul, designul și materialele publicate pe site ne aparțin.",
    ],
  },
  {
    title: "Răspundere",
    paragraphs: [
      "Serviciul este furnizat ca atare. Nu garantăm că interpretările generate sunt corecte și nu răspundem pentru deciziile luate pe baza lor.",
      "Răspunderea noastră este limitată la suma plătită de utilizator în ultimele 12 luni.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      `Pentru orice întrebare legată de acești termeni, scrie la ${SITE.email}.`,
      "Acestor termeni li se aplică legislația română.",
    ],
  },
];

export default function TermeniPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
          Termeni și condiții
        </h1>
        <p className="mt-4 text-sm text-paper-faint">
          Ultima actualizare: 7 septembrie 2026
        </p>

        <div className="mt-12 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title} className="border-t border-ink-line pt-8">
              <h2 className="font-serif text-2xl text-paper">{section.title}</h2>
              <div className="mt-4 space-y-3">
                {section.paragraphs.map((text, i) => (
                  <p key={i} className="leading-relaxed text-paper-dim">
                    {text}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
