import type { MindNode } from "@/lib/types";
import { DOMAIN_LABELS, NODE_TYPE_LABELS, displayLabel } from "@/lib/types";

/**
 * Instrucțiunile de extracție. Conținut stabil: identic pentru toți
 * utilizatorii și toate rulările, deci intră în prompt cache.
 *
 * Aici nu se poartă conversația — replicile sunt date separat, de un model mai
 * ieftin. Acesta face doar munca grea: ce este convingere, ce se unește cu ce.
 */
export const SYSTEM_INSTRUCTIONS = `Citești o bucată dintr-o conversație și
actualizezi harta mentală a omului care vorbește.

Cauți convingerile: propozițiile pe care le crede despre sine, despre ceilalți
și despre cum funcționează lumea, și care îi dictează reacțiile. De obicei nu
sunt spuse direct — se deduc din ce povestește, din ce evită, din ce îl irită.

Pe lângă ele: valorile, emoțiile care revin, obiectivele, temerile, tiparele de
reacție și relațiile importante.

## Reguli

- **Doar ce este susținut de cuvintele lui.** Dacă bucata de conversație este
  scurtă sau doar factuală, întoarce liste goale. Este perfect acceptabil să nu
  extragi nimic.
- **Fiecare observație are un citat exact**, cuvânt cu cuvânt din ce a spus el.
  Nu parafraza și nu cita replicile interlocutorului. Citatul este dovada pe
  care i-o arătăm când întreabă „de unde știi?".
- **Formulează la persoana întâi, în limbajul lui.** „Trebuie să fiu impecabil
  ca să fiu acceptat", nu „perfecționism condiționat".
- **Preferă actualizarea în locul creării.** Caută nodul în index înainte de a
  crea unul nou. „Trebuie să fiu perfect" și „dacă nu iese impecabil, nu merită"
  sunt același nod. La îndoială, actualizează.
- **Un singur nod per idee, chiar dacă apare de trei ori** în bucata primită.
  Adună mențiunile într-o singură observație, cu citatul cel mai limpede.
- **Încrederea crește lent.** O singură mențiune rareori trece de 0.5. Un tipar
  devine credibil prin repetare în timp, nu prin intensitatea unei propoziții.
- **Muchiile contează doar dacă spun ceva** — o convingere și temerea care o
  alimentează, o valoare și convingerea care o contrazice. Nu lega două noduri
  doar pentru că au apărut în aceeași conversație.

## Indexul hărții

- **Confirmate** — adevăr stabilit, validat de el. Folosește-i formularea exact
  cum a scris-o. Nu le contrazice.
- **Respinse** — interpretări pe care le-am greșit. Nu le repropune sub alt
  nume. Sunt exemple din care înveți ce nu este el.
- **Neconfirmate** — ipotezele de până acum. Le poți întări sau slăbi.`;

/**
 * Indexul hărții existente, împărțit pe verdicte.
 * Modelul îl primește *înainte* de a extrage, ca să facă fuziunea nodurilor din
 * prima, în loc să extragem orb și să curățăm după.
 */
export function buildGraphIndex(nodes: MindNode[]): string {
  if (nodes.length === 0) {
    return "## Harta este goală\n\nNu există încă niciun nod. Tot ce extragi este nou.";
  }

  const line = (n: MindNode) =>
    `- [${n.id}] (${NODE_TYPE_LABELS[n.type]}, ${DOMAIN_LABELS[n.domain]}, ` +
    `încredere ${n.confidence.toFixed(2)}) ${displayLabel(n)}` +
    `${n.summary ? ` — ${n.summary}` : ""}`;

  const confirmed = nodes.filter((n) => n.verdict === "confirmed" || n.verdict === "edited");
  const rejected = nodes.filter((n) => n.verdict === "rejected");
  const unconfirmed = nodes.filter((n) => n.verdict === "unconfirmed");

  const sections: string[] = ["## Indexul hărții"];

  if (confirmed.length > 0) {
    sections.push(
      "### Confirmate de el — adevăr stabilit, folosește-i formularea\n" +
        confirmed.map(line).join("\n"),
    );
  }
  if (rejected.length > 0) {
    sections.push(
      "### Respinse de el — interpretări greșite, nu le repropune\n" +
        rejected.map(line).join("\n"),
    );
  }
  if (unconfirmed.length > 0) {
    sections.push(
      "### Neconfirmate — ipotezele de până acum\n" + unconfirmed.map(line).join("\n"),
    );
  }

  return sections.join("\n\n");
}
