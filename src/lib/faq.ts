/**
 * Întrebările frecvente, într-un singur loc: apar pe prima pagină (primele
 * câteva) și pe /intrebari (toate, cu schema FAQPage pentru căutare). Un
 * singur text înseamnă un singur loc de corectat când se schimbă produsul.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: FaqItem[] = [
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
    q: "Ce sunt lecțiile?",
    a:
      "Conversații ghidate de cinci-șase pași, pe câte o temă care formează " +
      "convingeri. Sunt douăsprezece, așezate ca un drum: casa în care ai crescut, " +
      "mama, tata; ce aveai voie să simți, ce se întâmpla când greșeai, rușinea; " +
      "siguranța și felul în care te apropii de oameni; banii, munca și firma; " +
      "iar la final, ce le transmiți copiilor. Sunt construite pe terapia " +
      "schemelor. Întrebările nu se citesc de pe listă: se scriu în conversație, " +
      "din ce ai spus înainte.",
  },
  {
    q: "Trebuie să fac lecțiile în ordine?",
    a:
      "Da — una după alta. Următoarea se deschide când ai terminat-o pe cea " +
      "dinainte, pentru că fiecare se sprijină pe ce a ieșit în cele de dinaintea " +
      "ei: nu are sens să vorbim despre bani înainte să fi văzut casa în care ai " +
      "învățat ce înseamnă banii. Dacă nu vrei o lecție anume, poți oricând să " +
      "vorbești liber, fără temă, tot cu o ședință. O lecție lăsată la jumătate se " +
      "reia de unde a rămas, fără să plătești altă ședință.",
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
    q: "Cât costă?",
    a:
      "Prima ședință este gratuită — prima lecție de pe drum sau o conversație " +
      "liberă — ca să vezi ce cumperi. După ea, lucrezi pe programe: „Un tipar” " +
      "(4 ședințe și 2 transformări, 149 lei), „Harta completă” (12 ședințe, 6 " +
      "transformări, 349 lei) sau „Însoțire 3 luni” (12 ședințe și câte o " +
      "transformare pentru fiecare, 599 lei). Programele nu expiră, nu există " +
      "abonament și nu se reînnoiește nimic automat.",
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

/** Cele care contează pentru cineva care vede site-ul prima dată. */
export const FAQ_HOME = FAQ.slice(0, 6);
