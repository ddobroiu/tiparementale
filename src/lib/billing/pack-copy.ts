/**
 * Ce e diferit între pachete, dincolo de numere. Cheia e codul pachetului din
 * bază, nu poziția în listă: dacă se schimbă ordinea sau apare unul nou,
 * pagina (și e-mailurile) nu încep să mintă. Un pachet necunoscut primește culoarea neutră și
 * rândurile comune — nimic nu se rupe.
 */
export const PACK_COPY: Record<
  string,
  { color: string; fit: string; covers: string; recommended?: boolean }
> = {
  "un-tipar": {
    color: "#7cc4fb",
    fit: "Pentru un singur tipar, dus până la capăt.",
    covers: "Primele patru lecții de pe drum: casa în care ai crescut, mama, tata și ce aveai voie să simți.",
  },
  "harta-completa": {
    color: "#f6d186",
    recommended: true,
    fit: "Pentru harta întreagă, nu un colț din ea.",
    covers: "Exact cât are drumul: toate cele douăsprezece lecții, de la rădăcini până la ce transmiți copiilor.",
  },
  "insotire-3-luni": {
    color: "#c8b6ff",
    fit: "Pentru cine vrea să lucreze pe fiecare tipar, nu doar să-l vadă.",
    covers: "Tot drumul, cele douăsprezece lecții — și o transformare pentru fiecare: la fiecare pas, o convingere nouă în locul celei vechi.",
  },
};

export const PACK_COPY_NEUTRAL = { color: "#a7b5cb", fit: "", covers: "" };
