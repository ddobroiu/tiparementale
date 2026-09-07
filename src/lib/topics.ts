import type { LifeDomain } from "./types";

/**
 * Subiectele de abordat, pe zone de viață.
 *
 * Nu sunt categorii, sunt uși de intrare. Fiecare are întrebarea cu care
 * începe discuția — scrisă concret, despre un moment anume, nu despre o temă.
 * „Cum stai cu banii?" nu produce nimic; „care e prima amintire pe care o ai
 * legată de bani în casa în care ai crescut?" produce o poveste, iar din
 * povești ies convingerile.
 */

export interface Topic {
  id: string;
  title: string;
  opener: string;
}

export const TOPICS: Record<LifeDomain, Topic[]> = {
  money: [
    {
      id: "money-first",
      title: "Prima amintire cu banii",
      opener:
        "Care e prima amintire pe care o ai legată de bani, în casa în care ai crescut?",
    },
    {
      id: "money-enough",
      title: "Cât înseamnă „destul”",
      opener:
        "Ce sumă ar trebui să ai ca să te simți în siguranță? Și dacă ai avea-o mâine, crezi că te-ai simți așa?",
    },
    {
      id: "money-guilt",
      title: "Cheltuiala care te apasă",
      opener:
        "Când ai cheltuit ultima dată ceva pe tine și te-ai simțit vinovat după?",
    },
    {
      id: "money-ask",
      title: "Să ceri ce ți se cuvine",
      opener:
        "Cât de greu îți e să ceri o mărire sau să urmărești o plată întârziată? Povestește-mi ultima dată când s-a întâmplat.",
    },
  ],

  relationships: [
    {
      id: "rel-unsaid",
      title: "Ce nu spui",
      opener:
        "Ce e lucrul pe care nu i l-ai spus niciodată cuiva apropiat, deși l-ai gândit de multe ori?",
    },
    {
      id: "rel-fight",
      title: "Cearta care revine",
      opener:
        "Există o ceartă care se repetă în relațiile tale, chiar și cu oameni diferiți? Cum sună?",
    },
    {
      id: "rel-withdraw",
      title: "Când te retragi",
      opener:
        "Ce te face să te închizi în tine, chiar și când celălalt n-a greșit cu nimic?",
    },
    {
      id: "rel-first-step",
      title: "Cine face primul pas",
      opener:
        "După o ceartă, cine se apropie primul? Și ce se întâmplă în tine în timpul care trece până atunci?",
    },
  ],

  health: [
    {
      id: "health-signals",
      title: "Semnalele pe care le amâni",
      opener:
        "Ce îți spune corpul tău în ultima vreme și tu amâni să asculți?",
    },
    {
      id: "health-sleep",
      title: "Ultimul gând al zilei",
      opener: "La ce te gândești în ultimele minute înainte să adormi?",
    },
    {
      id: "health-postponed",
      title: "Ce amâni pentru tine",
      opener:
        "Ce lucru bun pentru tine amâni de cel mai mult timp? Și care spui că e motivul?",
    },
  ],

  work: [
    {
      id: "work-free",
      title: "Ce ai face și gratis",
      opener:
        "Ce parte din munca ta ai face și dacă nu te-ar plăti nimeni pentru ea?",
    },
    {
      id: "work-impostor",
      title: "Teama de a fi descoperit",
      opener:
        "Ai avut vreodată senzația că cineva o să-și dea seama că nu meriți locul în care ești?",
    },
    {
      id: "work-no",
      title: "Ultimul „nu”",
      opener: "Când ai spus ultima dată „nu” la muncă? Și ce te-a costat?",
    },
  ],

  family: [
    {
      id: "family-sentence",
      title: "Propoziția părintelui",
      opener:
        "Ce propoziție a unuia dintre părinții tăi o mai auzi și acum, în capul tău?",
    },
    {
      id: "family-never",
      title: "Ce ți-ai promis să nu repeți",
      opener:
        "Ce anume ți-ai promis, la un moment dat, că tu nu vei face niciodată așa cum au făcut ei?",
    },
    {
      id: "family-visit",
      title: "Drumul spre casă",
      opener:
        "Cum te simți în drum spre casa în care ai crescut? Descrie-mi ultima dată.",
    },
  ],

  children: [
    {
      id: "children-transmit",
      title: "Ce le transmiți fără să vrei",
      opener:
        "Ce crezi că învață copilul tău de la tine fără ca tu să-i fi spus vreodată în cuvinte?",
    },
    {
      id: "children-echo",
      title: "Când te-ai auzit ca părintele tău",
      opener:
        "A fost vreun moment în care te-ai auzit vorbind exact ca părintele tău? Ce se întâmplase atunci?",
    },
    {
      id: "children-spare",
      title: "Ce speri să nu simtă niciodată",
      opener: "Ce anume speri că nu va simți niciodată copilul tău?",
    },
  ],

  self: [
    {
      id: "self-voice",
      title: "Vocea din cap",
      opener:
        "Cum îți vorbești când greșești? Spune-mi cu ce cuvinte, exact.",
    },
    {
      id: "self-hidden",
      title: "Ce ascunzi",
      opener:
        "Ce parte din tine crezi că i-ar face pe ceilalți să se îndepărteze, dacă ar vedea-o?",
    },
    {
      id: "self-peace",
      title: "Ultima dată când te-ai simțit bine cu tine",
      opener:
        "Când te-ai simțit ultima dată împăcat cu tine? Ce se întâmpla atunci?",
    },
  ],

  meaning: [
    {
      id: "meaning-quiet",
      title: "Unde îți fuge mintea",
      opener: "Când nu ai absolut nimic de făcut, unde îți fuge mintea?",
    },
    {
      id: "meaning-regret",
      title: "Ce ai regreta",
      opener:
        "Dacă te-ai uita înapoi peste zece ani, ce te-ar durea cel mai tare că nu ai făcut?",
    },
    {
      id: "meaning-worth",
      title: "Ce ți se pare că are rost",
      opener:
        "Ce lucru ți se pare că are rost, chiar dacă nu îți aduce nimic în schimb?",
    },
  ],

  other: [],
};

export function findTopic(id: string): Topic | null {
  for (const list of Object.values(TOPICS)) {
    const found = list.find((t) => t.id === id);
    if (found) return found;
  }
  return null;
}
