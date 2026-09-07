import type { NodeType } from "@/lib/types";

/**
 * Forma unui nod spune ce fel de lucru este; culoarea spune din ce zonă de
 * viață vine. Două dimensiuni citite dintr-o privire, fără legendă.
 *
 * Formele nu sunt alese la întâmplare: convingerea e un cerc închis, tiparul
 * un hexagon care se poate repeta la nesfârșit, obiectivul urcă, temerea
 * coboară, valoarea stă în echilibru pe un vârf, emoția n-are colțuri.
 */

function polygon(sides: number, r: number, rotation: number): string {
  const points = Array.from({ length: sides }, (_, i) => {
    const angle = rotation + (i / sides) * Math.PI * 2;
    return `${(Math.cos(angle) * r).toFixed(2)},${(Math.sin(angle) * r).toFixed(2)}`;
  });
  return `M ${points.join(" L ")} Z`;
}

/** Pătrat cu colțuri atât de rotunjite încât nu mai are colțuri. */
function squircle(r: number): string {
  const a = r * 0.92;
  const c = a * 0.55;
  return (
    `M 0 ${-a} C ${c} ${-a} ${a} ${-c} ${a} 0 ` +
    `C ${a} ${c} ${c} ${a} 0 ${a} ` +
    `C ${-c} ${a} ${-a} ${c} ${-a} 0 ` +
    `C ${-a} ${-c} ${-c} ${-a} 0 ${-a} Z`
  );
}

export function glyphPath(type: NodeType, r: number): string | null {
  switch (type) {
    case "belief":
      // cerc: o buclă închisă, care se susține singură
      return null;
    case "pattern":
      return polygon(6, r * 1.06, Math.PI / 6);
    case "value":
      return polygon(4, r * 1.12, -Math.PI / 2);
    case "goal":
      return polygon(3, r * 1.18, -Math.PI / 2);
    case "fear":
      return polygon(3, r * 1.18, Math.PI / 2);
    case "emotion":
      return squircle(r);
    case "relationship":
      return null;
  }
}

interface Props {
  type: NodeType;
  r: number;
  color: string;
  fillOpacity: number;
  strokeOpacity: number;
  strokeWidth: number;
  dashed: boolean;
}

export function NodeGlyph({
  type,
  r,
  color,
  fillOpacity,
  strokeOpacity,
  strokeWidth,
  dashed,
}: Props) {
  const shared = {
    fill: color,
    fillOpacity,
    stroke: color,
    strokeOpacity,
    strokeWidth,
    strokeDasharray: dashed ? "3 3" : undefined,
    className: "transition-all duration-500",
  };

  // Relația: două cercuri care se suprapun, fiindcă despre asta e vorba.
  if (type === "relationship") {
    const small = r * 0.72;
    return (
      <g>
        <circle cx={-small * 0.45} r={small} {...shared} />
        <circle cx={small * 0.45} r={small} {...shared} />
      </g>
    );
  }

  const path = glyphPath(type, r);
  if (!path) return <circle r={r} {...shared} />;

  return <path d={path} strokeLinejoin="round" {...shared} />;
}
