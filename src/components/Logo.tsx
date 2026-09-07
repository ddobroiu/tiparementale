/**
 * Marca produsului.
 *
 * Nu o iconiță de creier și nu un bec: o mică rețea de noduri legate, închisă
 * într-un arc de profil. Este exact ce face aplicația — tipare legate între
 * ele, într-un cap — și rămâne lizibilă la 20 de pixeli, ceea ce un creier
 * desenat nu rămâne.
 */

interface Props {
  className?: string;
  /** Doar semnul, fără text. Pentru favicon sau spații strâmte. */
  markOnly?: boolean;
}

/** Nodurile mărcii, în coordonate de 32×32. */
const NODES = [
  { x: 11, y: 9, r: 2.6 },
  { x: 21, y: 12.5, r: 1.9 },
  { x: 12.5, y: 19, r: 1.9 },
  { x: 21.5, y: 22, r: 3.2 },
];

const LINKS = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
];

export function Logo({ className = "", markOnly = false }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 shrink-0"
        aria-hidden="true"
        fill="none"
      >
        {/* Arcul de profil: deschis în față, ca gândul să aibă pe unde intra. */}
        <path
          d="M 24.5 6.5 C 19 1.5 8 2.5 4.5 10 C 1.8 15.8 4 22.5 9.5 26 C 13 28.2 18 28.6 21.5 27"
          stroke="var(--belief)"
          strokeOpacity={0.55}
          strokeWidth={1.4}
          strokeLinecap="round"
        />

        {LINKS.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            stroke="var(--belief)"
            strokeOpacity={0.42}
            strokeWidth={1}
          />
        ))}

        {NODES.map((node, i) => (
          <circle
            key={i}
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill="var(--belief)"
            fillOpacity={i === 3 ? 0.95 : 0.5}
          />
        ))}
      </svg>

      {!markOnly && (
        <span className="font-serif text-lg leading-none tracking-tight whitespace-nowrap">
          Tipare<span className="text-paper-dim"> Mentale</span>
        </span>
      )}
    </span>
  );
}
