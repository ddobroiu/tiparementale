import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ANPC_SAL_URL, ANPC_URL, OPERATOR, OPERATOR_ADDRESS } from "@/lib/legal";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact și date firmă",
  description: `Cum ne contactezi și datele de identificare ale firmei care operează ${SITE.name}.`,
  alternates: { canonical: canonical("/contact") },
};

const ROWS: Array<[string, string]> = [
  ["Denumire", OPERATOR.name],
  ["CUI", `${OPERATOR.cui} (${OPERATOR.vatStatus})`],
  ["Nr. Reg. Com.", OPERATOR.regCom],
  ["EUID", OPERATOR.euid],
  ["Sediul social", OPERATOR_ADDRESS],
];

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">Contact</h1>
        <p className="mt-6 leading-relaxed text-paper-dim">
          Ne găsești exclusiv pe e-mail, la{" "}
          <a href={`mailto:${OPERATOR.email}`} className="text-paper underline underline-offset-4">
            {OPERATOR.email}
          </a>
          . Răspundem de obicei în câteva zile lucrătoare; cererile privind datele
          personale și reclamațiile, în cel mult 30 de zile.
        </p>

        <h2 className="mt-12 border-t border-ink-line pt-8 font-serif text-2xl text-paper">
          Date de identificare
        </h2>
        <p className="mt-3 text-paper-dim">
          {SITE.name} ({SITE.domain}) este operat de:
        </p>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
          {ROWS.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-paper-faint">{label}</dt>
              <dd className="text-paper-dim">{value}</dd>
            </div>
          ))}
          <dt className="text-paper-faint">E-mail</dt>
          <dd className="text-paper-dim">{OPERATOR.email}</dd>
        </dl>

        <h2 className="mt-12 border-t border-ink-line pt-8 font-serif text-2xl text-paper">
          Protecția consumatorilor
        </h2>
        <p className="mt-3 leading-relaxed text-paper-dim">
          Dacă nu rezolvăm împreună o nemulțumire, te poți adresa Autorității
          Naționale pentru Protecția Consumatorilor (
          <a href={ANPC_URL} target="_blank" rel="noopener noreferrer" className="text-paper underline underline-offset-4">
            anpc.ro
          </a>
          ) sau poți folosi procedurile de{" "}
          <a href={ANPC_SAL_URL} target="_blank" rel="noopener noreferrer" className="text-paper underline underline-offset-4">
            soluționare alternativă a litigiilor (SAL)
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
