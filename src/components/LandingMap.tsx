"use client";

import { DOMAIN_COLORS, DOMAIN_LABELS, type LifeDomain } from "@/lib/types";

/**
 * Mini-harta de pe prima pagină.
 *
 * Nu este o ilustrație: este produsul, cu date de exemplu. Cele trei etape se
 * explică arătând ce fac, nu descriindu-se.
 */

interface DemoNode {
  id: string;
  domain: LifeDomain;
  label: string;
  x: number;
  y: number;
  r: number;
}

const NODES: DemoNode[] = [
  {
    id: "perfect",
    domain: "self",
    label: "Trebuie să fac totul impecabil",
    x: 200,
    y: 150,
    r: 30,
  },
  {
    id: "enough",
    domain: "self",
    label: "Teama că nu sunt suficient",
    x: 88,
    y: 76,
    r: 21,
  },
  {
    id: "burnout",
    domain: "work",
    label: "Epuizare spre finalul săptămânii",
    x: 308,
    y: 232,
    r: 20,
  },
  {
    id: "scarce",
    domain: "money",
    label: "Banii se pot termina oricând",
    x: 324,
    y: 72,
    r: 21,
  },
  {
    id: "nohelp",
    domain: "relationships",
    label: "Nu cer ajutor niciodată",
    x: 104,
    y: 244,
    r: 20,
  },
];

const EDGES = [
  { from: "enough", to: "perfect", relation: "alimentează" },
  { from: "perfect", to: "burnout", relation: "duce la" },
  { from: "perfect", to: "nohelp", relation: "se sprijină pe" },
  { from: "scarce", to: "perfect", relation: "întărește" },
];

const byId = new Map(NODES.map((n) => [n.id, n]));

/** Ramurile prezente, ca reper de orientare — ca în harta reală. */
const BRANCHES: Array<{ domain: LifeDomain; x: number; y: number }> = [
  { domain: "self", x: 150, y: 34 },
  { domain: "money", x: 348, y: 30 },
  { domain: "work", x: 340, y: 292 },
  { domain: "relationships", x: 78, y: 296 },
];

export function LandingMap({ stage }: { stage: 0 | 1 | 2 }) {
  return (
    <div className="relative aspect-[4/3] w-full">
      <svg viewBox="0 0 400 320" className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id="glow">
            <stop offset="0%" stopColor="#c8b6ff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#c8b6ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="200" cy="150" r="150" fill="url(#glow)" />

        {BRANCHES.map((branch) => (
          <text
            key={branch.domain}
            x={branch.x}
            y={branch.y}
            textAnchor="middle"
            className="text-[8px] tracking-[0.2em] uppercase"
            fill={DOMAIN_COLORS[branch.domain]}
            fillOpacity={0.42}
          >
            {DOMAIN_LABELS[branch.domain]}
          </text>
        ))}

        {/* Etapa 2: conexiunile. Până atunci elementele plutesc neconectate. */}
        <g
          className="transition-opacity duration-1000"
          style={{ opacity: stage >= 1 ? 1 : 0 }}
        >
          {EDGES.map((edge) => {
            const from = byId.get(edge.from)!;
            const to = byId.get(edge.to)!;
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="var(--paper)"
                strokeOpacity={0.18}
                strokeWidth={1}
              />
            );
          })}
        </g>

        {NODES.map((node, i) => {
          const isFocus = node.id === "perfect";
          const resolved = isFocus && stage >= 2;
          const color = resolved ? "var(--value)" : DOMAIN_COLORS[node.domain];
          return (
            <g
              key={node.id}
              style={{
                animation: `node-appear 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.16}s both`,
                transformOrigin: `${node.x}px ${node.y}px`,
              }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={color}
                fillOpacity={
                  resolved ? 0.9 : isFocus && stage >= 1 ? 0.24 : 0.13
                }
                stroke={color}
                strokeOpacity={isFocus && stage >= 1 ? 0.85 : 0.4}
                strokeWidth={isFocus && stage >= 1 ? 1.5 : 1}
                strokeDasharray={isFocus && stage >= 1 ? undefined : "3 3"}
                className="transition-all duration-700"
              />
              {resolved && (
                <text
                  x={node.x}
                  y={node.y + 6}
                  textAnchor="middle"
                  className="fill-ink text-[18px] font-bold"
                >
                  ✓
                </text>
              )}
              <text
                x={node.x}
                y={node.y + node.r + 14}
                textAnchor="middle"
                className="fill-paper-dim text-[9px]"
              >
                {node.label.length > 26
                  ? `${node.label.slice(0, 25)}…`
                  : node.label}
              </text>
            </g>
          );
        })}

        {/* Etapa 2: verdictul utilizatorului peste nodul central. */}
        {stage === 1 && (
          <g className="animate-fade-up">
            <rect
              x={152}
              y={98}
              width={96}
              height={18}
              rx={9}
              fill="var(--ink)"
              stroke="var(--value)"
              strokeOpacity={0.5}
            />
            <text
              x={200}
              y={110}
              textAnchor="middle"
              className="fill-paper text-[8px] tracking-wide"
            >
              ✓ confirmat de tine
            </text>
          </g>
        )}
      </svg>

      {/* Etapa 3: convingerea nouă, bifele și sprijinul concret. */}
      {stage >= 2 && (
        <div className="animate-fade-up absolute right-0 bottom-0 w-[82%] rounded-xl border border-[color:var(--value)]/40 bg-ink-soft/95 p-3 backdrop-blur-sm sm:w-[70%]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] tracking-[0.16em] text-paper-faint uppercase">
              Convingerea nouă
            </p>
            <span className="rounded-full bg-[color:var(--value)] px-2 py-0.5 text-[9px] font-medium text-ink">
              ✓ Rezolvată
            </span>
          </div>
          <p className="mt-1 font-serif text-[13px] leading-snug text-[color:var(--value)]">
            Pot preda ceva bun fără să fie impecabil, și tot rămân în picioare.
          </p>
          <ul className="mt-2.5 space-y-1.5 text-[11px] leading-snug text-paper-dim">
            <li>
              <span className="text-[color:var(--value)]">☑</span>{" "}
              <span className="text-paper">Exercițiu</span> · Predă o singură
              sarcină la 90% și notează ce s-a întâmplat · făcut de 3 ori
            </li>
            <li>
              <span className="text-paper">Carte</span> · Darurile
              imperfecțiunii, Brené Brown
            </li>
            <li>
              <span className="text-paper">Film</span> · Whiplash (2014) —
              aceeași convingere, dusă până la capăt
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
