import type { Metadata } from "next";
import Link from "next/link";

import { Ext, LegalDocument, type LegalSection } from "@/components/LegalDocument";
import {
  ANPC_SAL_URL,
  ANPC_URL,
  OPERATOR,
  OPERATOR_ADDRESS,
  PRICE_NOTE,
} from "@/lib/legal";
import { SITE, canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  description:
    "Condițiile de utilizare a serviciului Tipare Mentale: cine îl furnizează, " +
    "ce cumperi exact, plata, factura, dreptul de retragere, rambursările și limitele serviciului.",
  alternates: { canonical: canonical("/termeni") },
};

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-paper underline underline-offset-4">
    {children}
  </Link>
);

const SECTIONS: LegalSection[] = [
  {
    title: "Cine furnizează serviciul",
    paragraphs: [
      `Site-ul ${SITE.domain} și serviciul ${SITE.name} („Serviciul”) sunt furnizate de ${OPERATOR.name} („noi”), CUI ${OPERATOR.cui}, ${OPERATOR.vatStatus}, înregistrată la Registrul Comerțului sub nr. ${OPERATOR.regCom}, EUID ${OPERATOR.euid}, cu sediul social în ${OPERATOR_ADDRESS}.`,
      <>
        Ne poți contacta la <a className="text-paper underline underline-offset-4" href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>. Comunicarea se face exclusiv în scris, prin e-mail.
      </>,
      "Prin crearea unui cont sau prin cumpărarea unui pachet accepți acești termeni. Dacă nu ești de acord cu ei, te rugăm să nu folosești Serviciul.",
    ],
  },
  {
    title: "Ce este Serviciul și ce nu este",
    paragraphs: [
      `${SITE.name} este un instrument digital de auto-observație și dezvoltare personală. Pe baza conversațiilor pe care le porți în aplicație (lecții ghidate sau conversație liberă), Serviciul folosește modele de inteligență artificială ca să extragă și să organizeze tipare de gândire (convingeri, valori, emoții, obiective) într-o hartă vizuală, să propună predicții pe care le confirmi sau le respingi, convingeri alternative și exerciții de lucru personal.`,
      "Serviciul NU este psihoterapie, consiliere psihologică, asistență medicală sau psihiatrică. Nu pune diagnostic, nu tratează afecțiuni și nu înlocuiește consultul unui psiholog, psihoterapeut sau medic. Conținutul generat are caracter informativ și de reflecție personală. Dacă ai o afecțiune sau urmezi un tratament, discută cu specialistul tău înainte de a lua decizii pe baza Serviciului.",
      "Dacă te confrunți cu o urgență de sănătate mintală sau ai gânduri de a-ți face rău, sună la 112 sau la Telefonul Antisuicid, 0800 801 200 (gratuit, non-stop). Serviciul nu monitorizează conversațiile și nu poate interveni în situații de criză.",
    ],
  },
  {
    title: "Inteligența artificială: limite",
    paragraphs: [
      "Răspunsurile, interpretările, predicțiile, convingerile alternative, exercițiile și recomandările (inclusiv de cărți și filme) sunt generate automat de modele de inteligență artificială. Ele pot fi inexacte, incomplete sau greșite și nu reprezintă opinia unui specialist.",
      "Poți confirma, reformula sau respinge oricând orice interpretare; cele respinse nu mai sunt propuse. Ești singurul care decide ce păstrezi pe hartă și ce faci cu ea. Folosirea rezultatelor și deciziile pe care le iei pe baza lor îți aparțin.",
      "Serviciul nu ia în privința ta decizii care să producă efecte juridice sau să te afecteze în mod similar semnificativ; rezultatele sunt propuneri pentru reflecția ta.",
    ],
  },
  {
    title: "Contul",
    paragraphs: [
      "Serviciul este destinat exclusiv persoanelor de cel puțin 18 ani. Prin crearea contului confirmi că ai împlinit 18 ani.",
      "La crearea contului ți se cere acordul cu acești termeni și consimțământul explicit pentru prelucrarea datelor pe care le scrii și care pot privi sănătatea ta (detalii în Politica de confidențialitate). Fără acest consimțământ Serviciul nu poate funcționa, pentru că tocmai conținutul conversațiilor este materia lui.",
      "Ești responsabil pentru corectitudinea adresei de e-mail, pentru păstrarea confidențialității parolei și pentru activitatea desfășurată prin contul tău. Contul este personal și nu poate fi cedat.",
      "Îți poți exporta datele și îți poți șterge contul oricând, din pagina Setări. Ștergerea este definitivă; ședințele și transformările neconsumate se pierd la ștergere (vezi și secțiunea despre rambursări).",
    ],
  },
  {
    title: "Ce cumperi: pachete, ședințe, transformări",
    paragraphs: [
      <>
        Fiecare cont nou primește gratuit lecția introductivă (o conversație scurtă, făcută o singură dată) și predicțiile aferente hărții. Lecțiile de pe drum și conversațiile libere cer un pachet. Pachetele disponibile, cu conținutul și prețul lor, sunt cele afișate pe pagina <A href="/pachete">Pachete și prețuri</A> în momentul comenzii.
      </>,
      "Pachetele se cumpără cu plată unică. Nu există abonament și nu există reînnoire automată; nu ți se va retrage niciodată o sumă fără o comandă nouă, făcută de tine. Numele unui pachet (de exemplu „Însoțire 3 luni”) descrie ritmul recomandat de lucru, nu o durată de valabilitate.",
      "O ședință înseamnă o conversație de până la 25 de replici, împreună cu prelucrarea ei în hartă. O transformare înseamnă generarea unei convingeri alternative pentru un element confirmat, cu exercițiile, exemplele și recomandările aferente. Ședințele și transformările se adaugă în contul tău după confirmarea plății și nu expiră cât timp contul există.",
      "Pentru protecția Serviciului, fiecare cont are și o limită tehnică de consum, dimensionată generos față de ce ai cumpărat, astfel încât utilizarea normală să nu fie afectată. Ne rezervăm dreptul de a limita utilizarea automatizată sau abuzivă.",
    ],
  },
  {
    title: "Prețuri, plată și factură",
    paragraphs: [
      `Prețurile sunt exprimate în lei (RON). ${PRICE_NOTE} Prețul afișat la momentul comenzii este prețul total plătit; nu se adaugă alte taxe.`,
      "Plata se face online, cu cardul, prin procesatorul de plăți Stripe. Datele cardului sunt introduse direct pe pagina Stripe și nu ajung la noi. Pe pagina de plată ți se cer numele, adresa de facturare și, opțional, codul fiscal al firmei, necesare facturii.",
      "Contractul se încheie în momentul în care plata este confirmată. După confirmare primești un e-mail, iar factura fiscală se emite automat prin platforma Oblio și se transmite în sistemul național RO e-Factura, conform legii. Suma facturată este suma plătită.",
    ],
  },
  {
    title: "Dreptul de retragere",
    paragraphs: [
      "Ca consumator, ai în principiu dreptul de a te retrage dintr-un contract încheiat la distanță în termen de 14 zile, fără a preciza motivele, conform OUG nr. 34/2014.",
      "Serviciul constă în conținut și servicii digitale furnizate imediat. De aceea, înainte de plată, îți cerem să bifezi că soliciți furnizarea imediată și că iei la cunoștință că îți pierzi dreptul de retragere odată cu începerea executării. Conform art. 16 lit. a) și m) din OUG nr. 34/2014, dreptul de retragere nu se aplică serviciilor prestate integral și conținutului digital a cărui furnizare a început cu acordul tău prealabil expres și cu confirmarea că ai luat la cunoștință pierderea dreptului de retragere.",
      "Executarea începe în momentul în care ședințele și transformările sunt adăugate în contul tău, adică imediat după confirmarea plății.",
    ],
  },
  {
    title: "Garanția noastră de rambursare",
    paragraphs: [
      "Independent de pierderea dreptului legal de retragere, îți rambursăm integral, la cerere, contravaloarea ședințelor și transformărilor neconsumate dintr-un pachet, dacă ne scrii în termen de 14 zile de la cumpărare. Valoarea neconsumată se calculează proporțional cu prețul pachetului. Rambursarea se face pe cardul folosit la plată, prin Stripe, în cel mult 14 zile de la cerere, iar pentru ea se emite factura de stornare corespunzătoare.",
      "Dacă o eroare tehnică a consumat o ședință sau o transformare fără să primești serviciul, o restituim în cont. Scrie-ne.",
      "Aceste angajamente nu îți restrâng drepturile legale privind conformitatea conținutului și a serviciilor digitale (OUG nr. 141/2021): dacă Serviciul nu funcționează conform celor descrise, ai dreptul la aducerea lui în conformitate, la reducerea prețului sau la încetarea contractului, în condițiile legii.",
    ],
  },
  {
    title: "Conținutul tău",
    paragraphs: [
      "Conținutul pe care îl scrii îți aparține. Ne acorzi doar dreptul, neexclusiv și gratuit, de a-l stoca și prelucra (inclusiv prin furnizorul de inteligență artificială) în măsura necesară furnizării Serviciului către tine, cât timp contul există. Nu îl folosim în alt scop și nu îl publicăm.",
      "Ești responsabil pentru ce scrii. Te rugăm să nu introduci date personale ale altor persoane decât în măsura strict necesară reflecției tale (de exemplu, relația cu un părinte, fără date de identificare inutile).",
    ],
  },
  {
    title: "Utilizare acceptabilă",
    paragraphs: [
      "Nu ai voie să folosești Serviciul pentru a genera conținut ilegal, pentru a hărțui sau a expune alte persoane, pentru a încerca să ocolești limitele de utilizare sau măsurile de securitate, să accesezi datele altor utilizatori, să copiezi sau să extragi automat conținutul site-ului ori să folosești Serviciul în scopuri comerciale fără acordul nostru scris.",
      "Putem suspenda sau închide un cont care încalcă aceste reguli, după ce, atunci când este posibil, te-am anunțat și ți-am dat ocazia să explici. În cazul închiderii pentru încălcarea termenilor, sumele pentru serviciile deja furnizate nu se rambursează; drepturile tale legale rămân neatinse.",
    ],
  },
  {
    title: "Proprietate intelectuală",
    paragraphs: [
      "Codul, designul, textele, lecțiile, articolele și celelalte materiale publicate pe site ne aparțin sau le folosim cu drept legal și sunt protejate de legislația privind dreptul de autor. Le poți folosi doar pentru uz personal, în cadrul Serviciului.",
      "Rezultatele generate pentru tine (harta, convingerile alternative, exercițiile) le poți folosi liber, în interes personal.",
    ],
  },
  {
    title: "Răspundere",
    paragraphs: [
      "Ne străduim ca Serviciul să fie disponibil și să funcționeze corect, dar pot exista întreruperi pentru mentenanță sau din cauze tehnice care nu țin de noi.",
      "Întrucât Serviciul nu este psihoterapie sau asistență medicală și rezultatele generate de inteligența artificială pot fi greșite, nu răspundem pentru deciziile pe care le iei exclusiv pe baza lor. În măsura permisă de lege, răspunderea noastră pentru prejudiciile indirecte este exclusă, iar cea pentru prejudiciile directe este limitată la sumele plătite de tine în ultimele 12 luni.",
      "Aceste limitări nu se aplică prejudiciilor cauzate cu intenție sau din culpă gravă, vătămării vieții, integrității corporale sau sănătății și nu îți restrâng drepturile pe care le ai ca consumator potrivit legii.",
    ],
  },
  {
    title: "Date personale și cookie-uri",
    paragraphs: [
      <>
        Modul în care prelucrăm datele tale este descris în <A href="/confidentialitate">Politica de confidențialitate</A>, iar cookie-urile, în <A href="/cookies">Politica de cookies</A>.
      </>,
    ],
  },
  {
    title: "Modificarea termenilor",
    paragraphs: [
      "Putem modifica acești termeni, de exemplu când se schimbă Serviciul sau legislația. Versiunea și data intrării în vigoare sunt afișate la începutul documentului. Te anunțăm prin e-mail despre modificările importante cu cel puțin 15 zile înainte de intrarea lor în vigoare; dacă nu ești de acord, poți înceta oricând utilizarea și îți poți șterge contul.",
      "Cumpărările rămân guvernate de versiunea termenilor acceptată la momentul plății (o reținem împreună cu plata).",
    ],
  },
  {
    title: "Reclamații, litigii, legea aplicabilă",
    paragraphs: [
      <>
        Pentru orice nemulțumire, scrie-ne la <a className="text-paper underline underline-offset-4" href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>. Răspundem în cel mult 30 de zile și încercăm întâi să rezolvăm amiabil.
      </>,
      <>
        Ca consumator, te poți adresa și Autorității Naționale pentru Protecția Consumatorilor (<Ext href={ANPC_URL}>anpc.ro</Ext>) sau poți apela la procedurile de soluționare alternativă a litigiilor (SAL): <Ext href={ANPC_SAL_URL} />.
      </>,
      "Acestor termeni li se aplică legea română. Litigiile care nu se rezolvă amiabil sunt de competența instanțelor judecătorești române. Dacă ești consumator, poți introduce acțiunea și la instanța de la domiciliul tău, iar alegerea legii nu te lipsește de protecția oferită de dispozițiile imperative ale legii din statul tău de reședință.",
    ],
  },
];

export default function TermeniPage() {
  return <LegalDocument title="Termeni și condiții" sections={SECTIONS} />;
}
