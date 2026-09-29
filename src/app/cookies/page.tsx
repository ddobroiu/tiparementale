import type { Metadata } from "next";
import Link from "next/link";

import { CookieSettingsButton } from "@/components/CookieSettingsButton";
import { LegalDocument, type LegalSection } from "@/components/LegalDocument";
import { OPERATOR } from "@/lib/legal";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Politica de cookies",
  description:
    "Ce cookie-uri și ce date stocate în browser folosește Tipare Mentale, pe categorii, și cum îți schimbi alegerea.",
  alternates: { canonical: canonical("/cookies") },
};

interface Row {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
}

const NECESSARY: Row[] = [
  {
    name: "tm_session",
    provider: SITE.domain,
    purpose: "Sesiunea de autentificare (te ține logat). HttpOnly, nu poate fi citit din pagină.",
    duration: "30 de zile",
  },
  {
    name: "tm_consent",
    provider: SITE.domain,
    purpose: "Alegerea ta privind cookie-urile (categoriile acceptate, versiunea, momentul).",
    duration: "6 luni",
  },
];

const ANALYTICS: Row[] = [
  {
    name: "_ga, _ga_<ID>",
    provider: "Google Analytics 4 (Google Ireland Ltd.)",
    purpose: "Deosebește vizitatorii și sesiunile, pentru statistici de trafic.",
    duration: "până la 2 ani",
  },
  {
    name: "_md_vid (cookie și localStorage)",
    provider: "mydashboard.ro (instrumentul nostru intern)",
    purpose: "Identificator aleator de vizitator, pentru statistici și pentru a lega o plată de sursa vizitei.",
    duration: "1 an",
  },
  {
    name: "_md_sid, _md_last (localStorage)",
    provider: "mydashboard.ro",
    purpose: "Vizita curentă și momentul ultimei activități (o vizită nouă începe după 30 de minute de pauză).",
    duration: "până la ștergere",
  },
  {
    name: "_clck",
    provider: "Microsoft Clarity (Microsoft Corporation)",
    purpose: "Statistici, hărți de clicuri și înregistrări ale sesiunii, cu conținutul introdus mascat: deosebește vizitatorii.",
    duration: "1 an",
  },
  {
    name: "_clsk",
    provider: "Microsoft Clarity (Microsoft Corporation)",
    purpose: "Leagă paginile vizitate într-o singură înregistrare a sesiunii.",
    duration: "1 zi",
  },
];

const MARKETING: Row[] = [
  {
    name: "_fbp",
    provider: "Meta Platforms Ireland Ltd.",
    purpose: "Identifică browserul pentru măsurarea reclamelor de pe Facebook și Instagram.",
    duration: "3 luni",
  },
  {
    name: "_fbc",
    provider: "Meta Platforms Ireland Ltd.",
    purpose: "Reține clicul pe o reclamă Meta (doar când vii dintr-o reclamă).",
    duration: "3 luni",
  },
  {
    name: "_ttp",
    provider: "TikTok Pixel (TikTok Technology Limited, Irlanda)",
    purpose: "Identifică browserul pentru măsurarea eficienței reclamelor TikTok și retargeting.",
    duration: "aprox. 13 luni",
  },
  {
    name: "_tt_enable_cookie",
    provider: "TikTok Pixel (TikTok Technology Limited, Irlanda)",
    purpose: "Reține dacă cookie-urile TikTok Pixel sunt permise în browser.",
    duration: "aprox. 13 luni",
  },
];

function Table({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink-line text-paper">
            <th className="py-2 pr-3 font-medium">Nume</th>
            <th className="py-2 pr-3 font-medium">Furnizor</th>
            <th className="py-2 pr-3 font-medium">Scop</th>
            <th className="py-2 font-medium">Durată</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-ink-line/60 align-top">
              <td className="py-2 pr-3 font-mono text-xs text-paper">{r.name}</td>
              <td className="py-2 pr-3">{r.provider}</td>
              <td className="py-2 pr-3">{r.purpose}</td>
              <td className="py-2">{r.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SECTIONS: LegalSection[] = [
  {
    title: "Ce sunt cookie-urile",
    paragraphs: [
      "Cookie-urile sunt fișiere mici pe care un site le salvează în browserul tău. Tehnologii asemănătoare, precum localStorage, păstrează date în browser în același scop. Politica de mai jos le acoperă pe toate.",
      "Conform Legii nr. 506/2004 și GDPR, cookie-urile strict necesare nu au nevoie de acord; toate celelalte se folosesc doar dacă îți dai acordul, pe categorii.",
    ],
  },
  {
    title: "Strict necesare",
    paragraphs: [
      "Fără ele nu poți intra în cont și nu ți-am putea respecta alegerea. Sunt mereu active.",
      <Table key="n" rows={NECESSARY} />,
    ],
  },
  {
    title: "Analitice (doar cu acordul tău)",
    paragraphs: [
      "Ne arată câți oameni vizitează site-ul, din ce surse vin și ce pagini citesc. Google Analytics rulează cu Google Consent Mode v2: fără acord, scriptul nu se încarcă deloc. Dacă refuzi, nici identificatorul mydashboard nu se creează și nu se transmite la plată. Microsoft Clarity se încarcă tot doar cu acord, numai pe paginile publice (niciodată în hartă, setări, autentificare sau admin), cu textul introdus mascat; datele pot fi prelucrate în SUA, în baza EU-US Data Privacy Framework.",
      <Table key="a" rows={ANALYTICS} />,
    ],
  },
  {
    title: "Marketing (doar cu acordul tău)",
    paragraphs: [
      "Măsoară dacă reclamele noastre de pe Facebook și Instagram aduc vizitatori care își fac cont sau cumpără un pachet. Cu acord, aceleași evenimente (cont creat, începerea plății, plata) se trimit la Meta și de pe serverul nostru (Conversions API), cu adresa de e-mail doar sub formă de amprentă criptografică. Meta nu primește niciodată conținutul conversațiilor.",
      "TikTok Pixel (TikTok Technology Limited, Irlanda) se încarcă tot doar cu acord de marketing, numai pe paginile publice (niciodată în hartă, setări, autentificare sau admin; singura excepție este revenirea după o plată reușită, doar pentru a înregistra plata: id-ul intern al comenzii, valoarea și pachetul, fără date personale). Scop: măsurarea eficienței reclamelor și retargeting. Datele pot fi transferate în afara UE (de exemplu în baza clauzelor contractuale standard).",
      <Table key="m" rows={MARKETING} />,
    ],
  },
  {
    title: "Pagina de plată",
    paragraphs: [
      "Plata se face pe pagina Stripe (checkout.stripe.com), nu pe site-ul nostru. Stripe folosește acolo propriile cookie-uri, necesare plății și prevenirii fraudei, conform politicii Stripe.",
    ],
  },
  {
    title: "Cum îți schimbi alegerea",
    paragraphs: [
      <>
        Oricând, din linkul „Setări cookies” din subsolul fiecărei pagini sau de aici:{" "}
        <CookieSettingsButton className="text-paper underline underline-offset-4" />. Retragerea acordului se aplică imediat, fără reîncărcare; identificatorii mydashboard și cookie-urile Clarity și TikTok se șterg din browser.
      </>,
      "Poți șterge sau bloca oricând cookie-urile și din setările browserului; blocarea celor strict necesare te va împiedica să intri în cont.",
      <>
        Detalii despre prelucrarea datelor găsești în <Link href="/confidentialitate" className="text-paper underline underline-offset-4">Politica de confidențialitate</Link>. Întrebări: <a className="text-paper underline underline-offset-4" href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
      </>,
    ],
  },
];

export default function CookiesPage() {
  return <LegalDocument title="Politica de cookies" sections={SECTIONS} />;
}
