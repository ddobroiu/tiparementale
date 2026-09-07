import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Politica de confidențialitate",
  description:
    "Ce date colectăm, de ce, cât le păstrăm și cum le poți exporta sau șterge.",
  alternates: { canonical: canonical("/confidentialitate") },
};

const SECTIONS = [
  {
    title: "Ce date colectăm",
    paragraphs: [
      "Adresa de email și o parolă, stocată exclusiv sub formă de amprentă criptografică — parola în clar nu există nicăieri în sistemele noastre și nu poate fi recuperată, doar resetată.",
      "Conținutul conversațiilor pe care le porți în aplicație, elementele extrase din ele (convingeri, valori, emoții, obiective, tipare) și citatele-sursă aferente.",
      "Date tehnice minime necesare funcționării: sesiunea de autentificare și consumul de resurse al contului tău.",
      "Dacă faci o cumpărare, plata este procesată de Stripe. Datele cardului nu trec prin serverele noastre și nu le vedem niciodată.",
    ],
  },
  {
    title: "De ce le prelucrăm",
    paragraphs: [
      "Pentru a-ți furniza serviciul: fără conținutul conversațiilor nu există hartă, iar fără citate nu ți-am putea arăta din ce a fost dedus fiecare element.",
      "Pentru a-ți administra contul, ședințele cumpărate și facturarea.",
      "Temeiul legal este executarea contractului dintre noi, respectiv obligațiile legale în cazul documentelor financiare.",
    ],
  },
  {
    title: "Ce NU facem",
    paragraphs: [
      "Nu vindem și nu închiriem datele tale nimănui.",
      "Nu folosim conversațiile tale pentru antrenarea unor modele de inteligență artificială.",
      "Nu citim conversațiile utilizatorilor. Accesul angajaților la conținut este restricționat tehnic și se produce doar la cererea ta explicită, pentru suport.",
      "Nu facem profilare în scop publicitar.",
    ],
  },
  {
    title: "Cum sunt protejate",
    paragraphs: [
      "Izolarea între utilizatori este impusă la nivelul bazei de date, nu doar în codul aplicației: politicile de securitate pe rânduri fac imposibil ca datele unui utilizator să fie returnate în contextul altuia, chiar și în cazul unei erori de programare.",
      "Aplicația se conectează la baza de date cu un rol care nu are acces în afara schemei proiectului și nu poate modifica structura bazei.",
      "Traficul este criptat integral prin HTTPS.",
    ],
  },
  {
    title: "Procesatori",
    paragraphs: [
      "Pentru generarea răspunsurilor și extragerea tiparelor folosim Anthropic (Claude). Conținutul trimis este prelucrat pentru a genera răspunsul și nu este folosit pentru antrenarea modelelor.",
      "Pentru plăți folosim Stripe. Pentru găzduire, Vercel.",
    ],
  },
  {
    title: "Cât păstrăm datele",
    paragraphs: [
      "Atât timp cât contul tău există. Ștergerea contului elimină definitiv conversațiile, harta, citatele și istoricul, fără copii de rezervă păstrate ulterior.",
      "Documentele financiare se păstrează pe durata impusă de legislația fiscală.",
    ],
  },
  {
    title: "Drepturile tale",
    paragraphs: [
      "Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție, conform Regulamentului (UE) 2016/679.",
      `Le poți exercita scriind la ${SITE.email}. Răspundem în cel mult 30 de zile.`,
      "Ai dreptul de a depune plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal.",
    ],
  },
];

export default function ConfidentialitatePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
          Politica de confidențialitate
        </h1>
        <p className="mt-4 text-sm text-paper-faint">
          Ultima actualizare: 7 septembrie 2026
        </p>
        <p className="mt-6 leading-relaxed text-paper-dim">
          Ce scrii în {SITE.name} este printre cele mai personale conținuturi pe
          care le poate produce cineva. Documentul acesta spune exact ce facem cu
          ele, în limbaj obișnuit.
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
