/**
 * Simbolul mărcii: un creier la care se lucrează — o daltă intră în el, sar
 * așchii. Spune într-un semn ce face produsul: nu contemplă mintea, o
 * cioplește. Desenat în 32×32, ca să rămână clar la 20 de pixeli, unde
 * ecusonul pictat nu mai arată nimic.
 *
 * Căile stau aici, nu în componentă, ca aceleași linii să facă și iconițele
 * (scripts/brand-assets.mjs) și antetul (components/BrandMark.tsx).
 */

export const BRAND_GOLD = "#d9b36a";
export const BRAND_INK = "#0a0a0f";

export interface MarkPath {
  d: string;
  /** Linie (contur) sau formă plină. */
  kind: "stroke" | "fill";
  width?: number;
  opacity?: number;
  /** `paper` pentru daltă, `gold` pentru creier și așchii. */
  tone: "gold" | "paper";
}

export const BRAND_MARK: MarkPath[] = [
  // Creierul, din profil: fruntea în stânga, ceafa în dreapta. Conturul se
  // oprește jos-dreapta, exact unde intră dalta.
  {
    d: "M 6.5 17.5 C 4 15.5 4.5 10.5 8 9 C 9 5 14 3.5 17 5.5 C 20.5 3.5 26 5.5 26.5 9.5 C 29 11 28.5 15.5 26 17 C 26.5 19 24.5 21 22 20.5",
    kind: "stroke",
    width: 1.8,
    tone: "gold",
  },
  // Lobul temporal, dedesubt.
  {
    d: "M 6.5 17.5 C 7.5 20 10.5 21.5 13 20.5 C 14.5 21.5 16 21 17 19.8",
    kind: "stroke",
    width: 1.8,
    tone: "gold",
  },
  // Fisura dintre emisfere.
  { d: "M 17 5.5 C 15.5 9 17.5 12.5 16 16", kind: "stroke", width: 1.2, opacity: 0.65, tone: "gold" },
  // Două circumvoluții, una pe fiecare emisferă.
  { d: "M 9 13 C 10.5 11 13 11.5 13.5 14", kind: "stroke", width: 1.1, opacity: 0.5, tone: "gold" },
  { d: "M 19.5 10.5 C 21.5 8.5 24 9.5 24.5 12", kind: "stroke", width: 1.1, opacity: 0.5, tone: "gold" },
  // Dalta, la 45°: lama (pană), tija, mânerul. Forme pline, ca să fie citită
  // ca unealtă și la 16 pixeli.
  { d: "M 17.67 19.93 L 19.93 17.67 L 22.41 20.85 L 20.85 22.41 Z", kind: "fill", tone: "paper" },
  { d: "M 20.99 22.26 L 22.26 20.99 L 26.51 25.23 L 25.23 26.51 Z", kind: "fill", tone: "paper" },
  { d: "M 24.67 27.07 L 27.07 24.67 L 30.96 28.56 L 28.56 30.96 Z", kind: "fill", tone: "paper" },
  // Așchiile care sar de la vârful daltei.
  { d: "M 17.2 16.6 L 15.6 15.2", kind: "stroke", width: 1.4, tone: "gold" },
  { d: "M 16.4 19.6 L 14.4 20.2", kind: "stroke", width: 1.4, tone: "gold" },
  { d: "M 20.4 16.2 L 21.2 14.1", kind: "stroke", width: 1.4, tone: "gold" },
];

/** Același semn ca text SVG, pentru scripturile care fac iconițe. */
export function brandMarkSvg(size: number, gold = BRAND_GOLD, paper = "#f4f3f0"): string {
  const paths = BRAND_MARK.map((p) => {
    const color = p.tone === "gold" ? gold : paper;
    return p.kind === "fill"
      ? `<path d="${p.d}" fill="${color}" stroke="${color}" stroke-width="0.6" stroke-linejoin="round"/>`
      : `<path d="${p.d}" stroke="${color}" stroke-width="${p.width}" stroke-opacity="${p.opacity ?? 1}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">${paths}</svg>`;
}
