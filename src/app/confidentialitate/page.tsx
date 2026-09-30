import type { Metadata } from "next";
import Link from "next/link";

import { Ext, LegalDocument, type LegalSection } from "@/components/LegalDocument";
import { ANSPDCP_URL, OPERATOR, OPERATOR_ADDRESS } from "@/lib/legal";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Politica de confidențialitate",
  description:
    "Cine prelucrează datele tale, ce date, de ce, pe ce temei, cui le transmitem, " +
    "cât le păstrăm și cum îți exerciți drepturile.",
  alternates: { canonical: canonical("/confidentialitate") },
};

const Mail = () => (
  <a className="text-paper underline underline-offset-4" href={`mailto:${OPERATOR.email}`}>
    {OPERATOR.email}
  </a>
);

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-paper underline underline-offset-4">
    {children}
  </Link>
);

const SECTIONS: LegalSection[] = [
  {
    title: "Cine este operatorul",
    paragraphs: [
      `Operatorul datelor tale este ${OPERATOR.name}, CUI ${OPERATOR.cui}, Nr. Reg. Com. ${OPERATOR.regCom}, cu sediul în ${OPERATOR_ADDRESS}, care furnizează serviciul ${SITE.name} pe ${SITE.domain}.`,
      <>
        Pentru orice întrebare despre datele tale ne scrii la <Mail />. Nu am desemnat un responsabil cu protecția datelor (DPO); toate cererile se trimit la această adresă.
      </>,
    ],
  },
  {
    title: "Ce date prelucrăm",
    paragraphs: [
      "Date de cont: adresa de e-mail, parola (stocată exclusiv ca amprentă criptografică — parola în clar nu există nicăieri la noi), numele afișat (dacă îl completezi), momentul acceptării termenilor și al consimțământului pentru datele sensibile, sesiunile de autentificare.",
      "Dacă alegi „Continuă cu Google”: de la Google primim adresa de e-mail a contului Google și confirmarea că adresa e verificată, identificatorul contului Google, numele și prenumele și, eventual, fotografia de profil. Păstrăm doar adresa de e-mail, identificatorul contului Google (ca să te recunoaștem la următoarea intrare) și, la un cont nou, prenumele, ca nume afișat; fotografia și numele complet nu le stocăm. Nu primim parola ta Google și nu avem acces la alte date din contul Google.",
      "Conținutul Serviciului: conversațiile pe care le porți în aplicație, elementele extrase din ele (convingeri, valori, emoții, obiective, tipare), citatele-sursă, predicțiile confirmate sau respinse, convingerile alternative, exercițiile și notițele tale. Prin natura lor, aceste date pot dezvălui informații despre sănătatea ta psihică și emoțională, despre viața ta de familie și, în funcție de ce alegi să scrii, alte informații sensibile.",
      "Date de plată și facturare: pachetul cumpărat, suma, data, starea plății, numele, adresa de facturare și, pentru firme, codul fiscal (colectate de Stripe pe pagina de plată), numărul și seria facturii, acordul dat înainte de plată și versiunea termenilor. Datele cardului sunt introduse direct la Stripe; noi nu le vedem și nu le stocăm.",
      "Date de consum: câte ședințe și transformări ai folosit și costul tehnic al fiecărei prelucrări, pentru limitele contului.",
      <>
        Date tehnice și de măsurare: alegerea privind cookie-urile și, doar cu acordul tău, datele colectate de Google Analytics, mydashboard.ro, Microsoft Clarity, Meta și TikTok (pagini vizitate, sursa vizitei, identificatori de cookie, adresa IP, tipul de browser). Detalii în <A href="/cookies">Politica de cookies</A>.
      </>,
      "Mesajele pe care ni le trimiți pe e-mail.",
      "E-mailuri: prenumele (dacă îl dai), alegerea privind e-mailurile cu noutăți și sfaturi și momentul ei, ce e-mailuri ți-am trimis și când, dezabonarea. Dacă ceri lecția introductivă pe e-mail fără cont: adresa, prenumele (opțional), pagina de pe care ai cerut-o, momentul și textul acordului.",
    ],
  },
  {
    title: "De ce și pe ce temei",
    paragraphs: [
      "Furnizarea Serviciului (contul, conversațiile, harta, transformările, e-mailurile de serviciu precum bun venit, resetarea parolei, confirmarea plății): executarea contractului — art. 6 alin. (1) lit. b) GDPR.",
      "Autentificarea cu Google, dacă o alegi (crearea contului sau intrarea în cont fără parolă, legarea de contul existent cu aceeași adresă): executarea contractului — art. 6 alin. (1) lit. b) GDPR. Acordul cu termenii și consimțământul pentru datele sensibile se cer și la crearea contului cu Google, la fel ca la crearea cu parolă.",
      "Prelucrarea conținutului conversațiilor, care poate include date privind sănătatea: consimțământul tău explicit — art. 9 alin. (2) lit. a) GDPR, cerut separat la crearea contului. Îl poți retrage oricând ștergându-ți contul (din Setări) sau scriindu-ne; retragerea nu afectează prelucrarea făcută până atunci, dar fără acest consimțământ Serviciul nu mai poate fi furnizat.",
      "Facturarea și evidența contabilă: îndeplinirea obligațiilor legale — art. 6 alin. (1) lit. c) GDPR (Legea contabilității nr. 82/1991, Codul fiscal, legislația RO e-Factura).",
      "Securitatea Serviciului, prevenirea fraudei și a abuzului, limitele tehnice de consum, apărarea în caz de litigiu: interesul nostru legitim — art. 6 alin. (1) lit. f) GDPR.",
      "E-mailurile cu pași de început, sfaturi și noutăți despre propriile servicii, trimise celor care și-au creat cont: Legea nr. 506/2004, art. 12 alin. (2) și interesul nostru legitim — art. 6 alin. (1) lit. f) GDPR. Le poți refuza de la înscriere și te poți dezabona oricând, cu un click, din orice e-mail. Conținutul lor se bazează doar pe starea contului (de exemplu, dacă ai început lecția introductivă sau câte puncte are harta), niciodată pe conținutul conversațiilor.",
      "Lecția introductivă trimisă pe e-mail vizitatorilor fără cont și un singur mesaj ulterior despre crearea contului: consimțământul tău — art. 6 alin. (1) lit. a) GDPR, dat prin bifa din formular și retras oricând prin dezabonare.",
      "Măsurarea traficului (Google Analytics, mydashboard.ro) și a campaniilor de publicitate (Meta Pixel și Conversions API, TikTok Pixel și Events API): consimțământul tău — art. 6 alin. (1) lit. a) GDPR, dat din bannerul de cookie-uri și retras oricând din „Setări cookies”.",
      "Furnizarea adresei de e-mail și a parolei (sau autentificarea cu Google) este necesară pentru cont, iar a datelor de facturare, pentru plată; fără ele nu putem încheia contractul. Restul datelor le furnizezi după cum alegi.",
    ],
  },
  {
    title: "Ce NU facem",
    paragraphs: [
      "Nu vindem și nu închiriem datele tale.",
      "Nu folosim conversațiile tale pentru antrenarea unor modele de inteligență artificială și nu le trimitem furnizorilor de publicitate. Meta, TikTok și Google nu primesc niciodată conținutul conversațiilor, harta sau vreun element extras din ele.",
      "Nu citim conversațiile utilizatorilor. Panoul nostru de administrare arată doar date de cont și de consum; accesul la conținut se face doar la cererea ta explicită, pentru suport.",
      "Serviciul nu ia decizii bazate exclusiv pe prelucrare automată care să producă efecte juridice asupra ta sau să te afecteze similar în mod semnificativ (art. 22 GDPR). Interpretările generate de inteligența artificială sunt propuneri pe care le confirmi sau le respingi tu.",
    ],
  },
  {
    title: "Cui transmitem datele",
    paragraphs: [
      "Anthropic PBC (SUA) — furnizorul modelelor de inteligență artificială (Claude) care generează răspunsurile și extrag tiparele. Primește conținutul conversațiilor necesar fiecărei prelucrări, ca persoană împuternicită. Conform termenilor comerciali ai furnizorului, datele trimise prin API nu sunt folosite pentru antrenarea modelelor și sunt păstrate de furnizor doar pentru o perioadă limitată, pentru siguranță și prevenirea abuzurilor.",
      "Hetzner Online GmbH (Germania) — găzduirea aplicației și a bazei de date, pe servere din Uniunea Europeană.",
      "Stripe (Stripe Payments Europe Ltd., Irlanda, și afiliații săi, inclusiv din SUA) — procesarea plăților; pentru plată, Stripe acționează și ca operator independent, conform propriei politici.",
      "Oblio Software SRL (România) — emiterea facturilor; facturile se transmit în sistemul RO e-Factura al ANAF.",
      "Resend (Plus Five Five, Inc., SUA) — trimiterea e-mailurilor de serviciu (bun venit, resetarea parolei, confirmarea plății) și a celor cu sfaturi și noutăți.",
      "Google Ireland Ltd. (Irlanda) — autentificarea cu „Continuă cu Google”, doar dacă o alegi: Google confirmă identitatea ta și ne transmite datele de profil descrise mai sus, pentru crearea contului sau intrarea în cont. Google știe astfel că te-ai conectat la Tipare Mentale; prelucrarea din contul tău Google se face conform politicii de confidențialitate Google.",
      "mydashboard.ro — instrumentul nostru intern de statistici, operat tot de noi, găzduit în UE; primește date doar cu acordul tău pentru cookie-uri analitice.",
      "Google Ireland Ltd. (Google Analytics 4), Microsoft Corporation (Microsoft Clarity: hărți de clicuri și înregistrări ale sesiunii pe paginile publice, cu conținutul introdus mascat) și Meta Platforms Ireland Ltd. (Meta Pixel și Conversions API) — doar cu acordul tău, cu datele descrise în Politica de cookies. Pentru Meta, e-mailul se transmite doar sub formă de amprentă criptografică ireversibilă.",
      "TikTok Technology Limited (Irlanda) — TikTok Pixel și, după o plată confirmată, evenimentul de plată trimis de pe serverul nostru (Events API: valoarea, moneda, pachetul și id-ul comenzii, e-mailul, telefonul și id-ul contului ca amprentă SHA-256, adresa IP, browserul, identificatorii _ttp / tt_ttclid), pentru măsurarea eficienței reclamelor și retargeting; doar cu acordul tău pentru cookie-uri de marketing, retras oricând din „Setări cookies” (cookie-urile de marketing se folosesc numai cu acord). Detalii în Politica de cookies.",
      "Autorități publice (de exemplu ANAF), atunci când legea ne obligă.",
    ],
  },
  {
    title: "Transferuri în afara Spațiului Economic European",
    paragraphs: [
      "Anthropic, Resend, Stripe, Google, Microsoft și Meta pot prelucra date în SUA; TikTok poate transfera date în afara Spațiului Economic European. Transferurile se fac pe baza deciziei de adecvare a Comisiei Europene pentru Cadrul UE–SUA privind protecția datelor (Data Privacy Framework), pentru furnizorii certificați, și/sau pe baza clauzelor contractuale standard aprobate de Comisia Europeană, împreună cu măsurile suplimentare prevăzute în contractele acestor furnizori. Ne poți cere detalii la adresa de contact.",
    ],
  },
  {
    title: "Cât păstrăm datele",
    paragraphs: [
      "Contul și conținutul Serviciului: cât timp contul există. Ștergerea contului elimină definitiv conversațiile, harta, citatele, istoricul și datele de consum din baza noastră de date.",
      "Facturile și documentele financiare: 10 ani de la încheierea exercițiului financiar, conform Legii nr. 82/1991; ele se păstrează în platforma de facturare Oblio și în evidența contabilă, chiar dacă îți ștergi contul.",
      "Cererile de lecție pe e-mail (fără cont): până la dezabonare sau până la ștergerea la cerere. Jurnalul e-mailurilor trimise: cât există contul sau cererea. Adresele dezabonate rămân pe lista de dezabonări, doar ca să nu mai primească nimic.",
      "Sesiunile de autentificare expiră după 30 de zile; linkurile de resetare a parolei, după 60 de minute.",
      "Alegerea privind cookie-urile: 6 luni. Datele din instrumentele de măsurare: conform setărilor acestora (de exemplu, Google Analytics: cel mult 14 luni).",
      "Corespondența cu noi: cât este necesar pentru a rezolva cererea și, ulterior, cel mult 3 ani, pentru apărarea în eventuale litigii.",
    ],
  },
  {
    title: "Cum sunt protejate",
    paragraphs: [
      "Izolarea între utilizatori este impusă la nivelul bazei de date (politici de securitate pe rânduri), nu doar în codul aplicației. Aplicația se conectează cu un rol limitat la schema proiectului. Parolele sunt stocate doar ca amprente criptografice. Traficul este criptat integral prin HTTPS.",
    ],
  },
  {
    title: "Drepturile tale",
    paragraphs: [
      "Conform Regulamentului (UE) 2016/679 (GDPR), ai dreptul: de acces la date; de rectificare; de ștergere; de restricționare a prelucrării; la portabilitate; de opoziție la prelucrările bazate pe interes legitim; de a-ți retrage oricând consimțământul, fără a afecta legalitatea prelucrării anterioare; de a nu face obiectul unei decizii bazate exclusiv pe prelucrare automată.",
      <>
        Multe le poți exercita singur, din pagina Setări: exportul complet al datelor (fișier JSON) și ștergerea contului. Pentru restul, scrie-ne la <Mail />. Răspundem în cel mult o lună de la primirea cererii, termen care poate fi prelungit în condițiile legii.
      </>,
      <>
        Ai dreptul de a depune plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), B-dul G-ral. Gheorghe Magheru nr. 28-30, sector 1, București, <Ext href={ANSPDCP_URL}>www.dataprotection.ro</Ext>.
      </>,
    ],
  },
  {
    title: "Minori",
    paragraphs: [
      "Serviciul este destinat exclusiv persoanelor de cel puțin 18 ani. Nu colectăm cu bună știință date ale minorilor; dacă aflăm că un cont aparține unui minor, îl ștergem.",
    ],
  },
  {
    title: "Modificări",
    paragraphs: [
      "Putem actualiza această politică. Versiunea și data intrării în vigoare sunt afișate la început; despre modificările importante te anunțăm prin e-mail.",
    ],
  },
];

export default function ConfidentialitatePage() {
  return (
    <LegalDocument
      title="Politica de confidențialitate"
      intro={
        <p>
          Ce scrii în {SITE.name} este printre cele mai personale conținuturi pe
          care le poate produce cineva. Documentul acesta spune exact ce facem cu
          ele, în limbaj obișnuit, conform art. 13 din GDPR.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
