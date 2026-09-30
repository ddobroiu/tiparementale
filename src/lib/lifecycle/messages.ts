import { appUrl } from "@/lib/billing/stripe";
import { PACK_COPY } from "@/lib/billing/pack-copy";
import type { Pack } from "@/lib/billing/packs";
import type { EmailContent } from "@/lib/email";
import { INTRO_GUIDE } from "@/lib/program";

import type { UserSnapshot } from "./snapshot";

/**
 * Textele e-mailurilor din ciclul de viață.
 *
 * Reguli, aceleași ca pe site: nimic inventat — nici rezultate, nici cifre,
 * nici mărturii. Tot ce e personal vine din bază (`UserSnapshot`); unde nu e
 * nimic, textul spune pasul următor, nu un progres închipuit. Nu promitem
 * vindecare sau schimbare garantată: e un instrument de auto-observație, nu
 * terapie. Fără reduceri și fără grabă.
 */

type Message = Omit<EmailContent, "to" | "unsubscribe">;

const MAP = () => `${appUrl()}/harta`;
const SIGNUP = () => `${appUrl()}/intra?cont=nou`;

/** Prenumele, curățat; gol dacă nu l-a dat. */
function hello(name: string | null | undefined, fallback: string): string {
  const clean = (name ?? "").trim().split(/\s+/)[0]?.slice(0, 40) ?? "";
  return clean ? `${fallback}, ${clean}.` : `${fallback}.`;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? `un ${one}` : `${n} ${many}`;
}

const FIRST_QUESTION = INTRO_GUIDE.steps[0]?.question ?? "";

const MARKETING_FOOTNOTE =
  "Primești acest e-mail pentru că ți-ai creat un cont pe tiparementale.ro. Te poți dezabona oricând, cu linkul de mai jos; contul rămâne neatins.";

const LEAD_FOOTNOTE =
  "Primești acest e-mail pentru că ai cerut lecția introductivă pe tiparementale.ro. Te poți dezabona oricând, cu linkul de mai jos.";

// ---------------------------------------------------------------- cont

export function welcomeMessage(name: string | null): Message {
  return {
    subject: "Harta ta a pornit",
    heading: `${hello(name, "Bine ai venit")} Harta ta e goală, și asta e bine.`,
    paragraphs: [
      `Primul pas e lecția introductivă, „${INTRO_GUIDE.title}”: gratuită, cam zece minute, despre un singur lucru pe care îl faci mereu, deși te costă. O găsești în lista de lecții, când deschizi harta.`,
      `Prima întrebare e aceasta: „${FIRST_QUESTION}” Răspunde cum îți vine — sau alege una dintre variantele propuse.`,
      "Din ce spui, prima ta convingere apare pe hartă, cu citatul din care a fost dedusă. Poți confirma, respinge sau reformula orice. Nimic nu se hotărăște peste tine.",
      "Ce scrii rămâne al tău: poți exporta sau șterge tot, oricând, din setări.",
    ],
    cta: { label: "Deschide harta", url: MAP() },
    footnote:
      "Primești acest mesaj pentru că ți-ai creat un cont pe tiparementale.ro. Dacă n-ai fost tu, răspunde la acest e-mail și ștergem contul.",
  };
}

/** Ziua 1, doar dacă n-a scris încă nimic. */
export function day1Message(name: string | null): Message {
  return {
    subject: "Zece minute, o singură întrebare",
    heading: hello(name, "Prima întrebare te așteaptă"),
    paragraphs: [
      "Ți-ai făcut contul ieri, dar harta e încă goală. E în regulă: primul pas pare mai mare decât este.",
      `Cum începi: deschizi harta, alegi lecția introductivă „${INTRO_GUIDE.title}” și răspunzi la prima întrebare. E gratuită și nu consumă nimic din cont.`,
      `Întrebarea: „${FIRST_QUESTION}”`,
      "Nu există răspuns bun sau greșit. Poți scrie două rânduri sau poți alege o variantă gata formulată și s-o nuanțezi după. La final, regula ta apare pe hartă cu cuvintele tale, și tu hotărăști dacă e corectă.",
    ],
    cta: { label: "Începe lecția introductivă", url: MAP() },
    footnote: MARKETING_FOOTNOTE,
  };
}

/** Ziua 3: ce a făcut până acum și ce urmează, din datele lui. */
export function day3Message(name: string | null, s: UserSnapshot): Message {
  const paragraphs: string[] = [];

  if (!s.acted) {
    paragraphs.push(
      "Harta ta e încă goală. Ca să vezi dacă îți folosește, lecția introductivă e cel mai scurt drum: cam zece minute, gratuită.",
      "Cum lucrează harta: fiecare punct de pe ea e dedus din ce ai spus și păstrează citatul exact. Tu îl confirmi, îl respingi sau îl reformulezi. Cu cât răspunzi mai concret — o scenă, o frază auzită acasă — cu atât punctele sunt mai precise.",
    );
  } else {
    if (s.nodes > 0) {
      const confirmed =
        s.confirmed > 0
          ? ` ${s.confirmed === 1 ? "Unul e confirmat" : `${s.confirmed} sunt confirmate`} de tine.`
          : "";
      paragraphs.push(`Pe harta ta sunt acum ${plural(s.nodes, "punct", "puncte")}.${confirmed}`);
    } else {
      paragraphs.push(
        "Ai început, dar pe hartă nu a apărut încă niciun punct. Un punct se formează când același lucru apare în mai multe momente din ce povestești — de aceea contează scenele concrete.",
      );
    }

    if (s.unconfirmed > 0) {
      paragraphs.push(
        `${s.unconfirmed === 1 ? "Un punct așteaptă" : `${s.unconfirmed} puncte așteaptă`} verdictul tău. Deschide-l, citește citatul din care a fost dedus și spune dacă e adevărat pentru tine. Harta se ține după verdictul tău, nu după al modelului.`,
      );
    }

    if (!s.introDone) {
      paragraphs.push(
        `Lecția introductivă, „${INTRO_GUIDE.title}”, nu e încă încheiată. O reiei de unde ai rămas.`,
      );
    } else if (s.next) {
      paragraphs.push(
        s.sessions > 0
          ? `Următorul pas pe drum: lecția ${s.next.number}, „${s.next.title}”.`
          : `Următorul pas pe drum ar fi lecția ${s.next.number}, „${s.next.title}”. Lecțiile de pe drum cer un pachet; până atunci, ce e deja pe hartă rămâne al tău și poți lucra cu el.`,
      );
    }
  }

  return {
    subject: s.acted ? "Unde ai ajuns pe hartă" : "Cum lucrează harta",
    heading: hello(name, "Trei zile de hartă"),
    paragraphs,
    cta: { label: "Deschide harta", url: MAP() },
    footnote: MARKETING_FOOTNOTE,
  };
}

/** Ziua 7, doar fără nicio plată: pachetele, cu prețurile reale. */
export function day7Message(name: string | null, packs: Pack[]): Message {
  const lines = packs.map((p) => {
    const covers = PACK_COPY[p.code]?.covers;
    return `${p.name} — ${p.priceRon.toLocaleString("ro-RO")} lei: ${p.sessions} ședințe și ${p.transformations} transformări.${covers ? ` ${covers}` : ""}`;
  });

  return {
    subject: "Ce urmează după lecția introductivă",
    heading: hello(name, "Dacă vrei să mergi mai departe"),
    paragraphs: [
      "Lecția introductivă și predicțiile rămân gratuite. Drumul de douăsprezece lecții — de la casa în care ai crescut până la ce transmiți mai departe — și transformările cer un pachet.",
      ...lines,
      "Plătești o singură dată, fără abonament, iar ședințele nu expiră. O transformare îți dă o convingere nouă pentru un tipar pe care l-ai confirmat, cu exerciții pe care le faci și le notezi în timp.",
      "Dacă acum nu e momentul, nu e nimic de făcut: harta rămâne a ta.",
    ],
    cta: { label: "Vezi pachetele", url: `${appUrl()}/pachete` },
    footnote: MARKETING_FOOTNOTE,
  };
}

/** A doua zi după o plată: cum folosești ce ai cumpărat. */
export function postPurchaseMessage(name: string | null, s: UserSnapshot): Message {
  const balance = `Acum ai în cont ${plural(s.sessions, "ședință", "ședințe")} și ${
    s.transformations === 1 ? "o transformare" : `${s.transformations} transformări`
  }.`;

  return {
    subject: s.lastPack ? `Cum lucrezi cu „${s.lastPack}”` : "Cum lucrezi cu pachetul tău",
    heading: hello(name, "Câteva lucruri care ajută"),
    paragraphs: [
      balance,
      s.next
        ? `Continui cu lecția ${s.next.number}, „${s.next.title}”. Lecțiile se deschid una din alta, în ordinea drumului.`
        : "Ai parcurs toate lecțiile drumului. Poți lucra mai departe în conversație liberă, pe ce e încă neclar pe hartă.",
      "Lasă timp între lecții. Una pe săptămână e un ritm bun: ce iese la suprafață are nevoie de câteva zile ca să se așeze.",
      "După fiecare lecție, trece prin punctele noi de pe hartă și dă-le verdictul tău. Cele confirmate sunt cele pe care poți face o transformare: o convingere nouă, cu exerciții pe care le bifezi în timp.",
      "Nimic nu expiră. Dacă ai o întrebare despre program, răspunde la acest e-mail.",
    ],
    cta: { label: "Deschide harta", url: MAP() },
    footnote: MARKETING_FOOTNOTE,
  };
}

/** O singură dată, după 30 de zile fără activitate. */
export function reengageMessage(name: string | null, s: UserSnapshot): Message {
  const paragraphs: string[] = [];

  if (s.nodes > 0) {
    paragraphs.push(
      `Harta ta e unde ai lăsat-o: ${plural(s.nodes, "punct", "puncte")}, fiecare cu citatul lui.`,
    );
  } else {
    paragraphs.push("Contul tău e unde l-ai lăsat. Harta încă n-a pornit.");
  }

  if (!s.introDone) {
    paragraphs.push(
      `Dacă vrei să reiei, cel mai scurt pas e lecția introductivă, „${INTRO_GUIDE.title}”: gratuită, cam zece minute.`,
    );
  } else if (s.next && s.sessions > 0) {
    paragraphs.push(
      `Ai în cont ${plural(s.sessions, "ședință", "ședințe")}. Continui cu lecția ${s.next.number}, „${s.next.title}”.`,
    );
  } else {
    paragraphs.push("Dacă vrei să reiei, începi exact de unde ai rămas.");
  }

  paragraphs.push(
    "Fără presiune. Acesta e singurul e-mail de acest fel pe care ți-l trimitem.",
  );

  return {
    subject: "Harta ta e unde ai lăsat-o",
    heading: hello(name, "Salut din nou"),
    paragraphs,
    cta: { label: "Deschide harta", url: MAP() },
    footnote: MARKETING_FOOTNOTE,
  };
}

// ---------------------------------------------------------------- vizitatori

export function leadWelcomeMessage(name: string | null): Message {
  return {
    subject: `Lecția introductivă: „${INTRO_GUIDE.title}”`,
    heading: hello(name, "Prima întrebare, s-o porți cu tine azi"),
    paragraphs: [
      `Ai cerut lecția introductivă „${INTRO_GUIDE.title}”. E gratuită și durează cam zece minute.`,
      `Prima ei întrebare e aceasta: „${FIRST_QUESTION}”`,
      "Nu trebuie să răspunzi acum. Doar observă, azi, când se întâmplă: cine e de față, ce faci, ce spui.",
      "Când vrei s-o faci întreagă, îți creezi un cont gratuit. Lecția continuă cu scena concretă, cu ce simți că s-ar întâmpla dacă n-ai face-o și cu locul de unde ai învățat-o. La final, regula ta apare pe o hartă, cu citatul din care a fost dedusă — și tu hotărăști dacă e corectă.",
    ],
    cta: { label: "Începe lecția, gratuit", url: SIGNUP() },
    footnote: LEAD_FOOTNOTE,
  };
}

export function leadFollowupMessage(name: string | null): Message {
  return {
    subject: "Lecția introductivă te așteaptă",
    heading: hello(name, "Ai observat-o?"),
    paragraphs: [
      `Acum trei zile ți-am trimis prima întrebare din „${INTRO_GUIDE.title}”: „${FIRST_QUESTION}”`,
      "Dacă ai prins-o în câteva momente, ai deja materialul pentru lecție. Îți faci un cont gratuit, treci prin cei cinci pași ai lecției și vezi regula scrisă cu cuvintele tale, pe hartă.",
      "Ce scrii rămâne al tău: poți exporta sau șterge tot, oricând. Nu este terapie; e un instrument de auto-observație.",
      "Acesta e ultimul e-mail pe care ți-l trimitem despre lecție.",
    ],
    cta: { label: "Creează contul și începe", url: SIGNUP() },
    footnote: LEAD_FOOTNOTE,
  };
}
