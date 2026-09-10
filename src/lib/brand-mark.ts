/**
 * Simbolul mărcii: un creier din profil, auriu, cu trei puncte legate în
 * interior — o hartă în minte. Desenat în 32×32, ca să rămână clar la 20 de
 * pixeli, unde ecusonul pictat nu mai arată nimic.
 *
 * Căile stau aici, nu în componentă, ca aceleași linii să facă și iconițele
 * (scripts/brand-assets.mjs) și antetul (components/BrandMark.tsx).
 */

export const BRAND_GOLD = "#d9b36a";
export const BRAND_GOLD_LIGHT = "#f1d59a";
export const BRAND_INK = "#0a0a0f";

export interface MarkShape {
  d: string;
  kind: "stroke" | "fill";
  width?: number;
  opacity?: number;
  /** `light` pentru accente (punctele), `gold` pentru rest. */
  tone?: "gold" | "light";
}

export const BRAND_MARK: MarkShape[] = [
  // Conturul, din profil: fruntea în stânga, două circumvoluții sus, ceafa în
  // dreapta, cerebelul jos-dreapta, lobul temporal jos-stânga.
  {
    d:
      "M 16 26 C 12 27 8.5 24.5 8 21.5 " +
      "C 4.5 20.5 3.5 15.5 5.5 12.5 " +
      "C 4 8.5 7.5 5.5 11 6 " +
      "C 12.5 3 17 2.5 19 4.8 " +
      "C 21.5 2.8 26.5 4.2 27 8 " +
      "C 30 10 29.5 15 27 16.5 " +
      "C 28.8 19.5 26.5 22 23.5 21.8 " +
      "C 23.5 24.5 20 26.5 16 26 Z",
    kind: "stroke",
    width: 1.8,
  },
  // Trunchiul, scurt, ușor înclinat.
  { d: "M 17 25.8 L 18.6 29.2", kind: "stroke", width: 2 },
  // Șanțurile: central, fisura laterală, pliul dinspre ceafă.
  {
    d: "M 19 4.8 C 17 8 19 11 17 14",
    kind: "stroke",
    width: 1.2,
    opacity: 0.75,
  },
  {
    d: "M 8 21.5 C 11 20 12.5 17.5 11.5 15",
    kind: "stroke",
    width: 1.2,
    opacity: 0.75,
  },
  {
    d: "M 27 16.5 C 25 16.5 23.5 17 22.5 17.5",
    kind: "stroke",
    width: 1.2,
    opacity: 0.75,
  },
  // Harta din interior: trei puncte legate — capetele șanțurilor.
  {
    d: "M 17 14 L 11.5 15 M 17 14 L 22.5 17.5",
    kind: "stroke",
    width: 0.9,
    opacity: 0.55,
  },
  {
    d: "M 17 14 m -1.6 0 a 1.6 1.6 0 1 0 3.2 0 a 1.6 1.6 0 1 0 -3.2 0",
    kind: "fill",
    tone: "light",
  },
  {
    d: "M 11.5 15 m -1.1 0 a 1.1 1.1 0 1 0 2.2 0 a 1.1 1.1 0 1 0 -2.2 0",
    kind: "fill",
    tone: "light",
  },
  {
    d: "M 22.5 17.5 m -1.1 0 a 1.1 1.1 0 1 0 2.2 0 a 1.1 1.1 0 1 0 -2.2 0",
    kind: "fill",
    tone: "light",
  },
];

/** Același semn ca text SVG, pentru scripturile care fac iconițe. */
export function brandMarkSvg(size: number): string {
  const paths = BRAND_MARK.map((p) => {
    const color = p.tone === "light" ? BRAND_GOLD_LIGHT : BRAND_GOLD;
    return p.kind === "fill"
      ? `<path d="${p.d}" fill="${color}"/>`
      : `<path d="${p.d}" stroke="${color}" stroke-width="${p.width}" stroke-opacity="${p.opacity ?? 1}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">${paths}</svg>`;
}
