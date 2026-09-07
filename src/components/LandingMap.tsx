"use client";

import { NODE_TYPE_LABELS, type NodeType } from "@/lib/types";

/**
 * Mini-harta de pe prima pagină.
 *
 * Nu este o ilustrație: este produsul, cu date de exemplu. Cele trei etape se
 * explică arătând ce fac, nu descriindu-se.
 */

interface DemoNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  r: number;
}

const NODES: DemoNode[] = [
  { id: "belief", type: "belief", label: "Trebuie să fac totul impecabil", x: 200, y: 152, r: 30 },
  { id: "fear", type: "fear", label: "Teama că nu sunt suficient", x: 84, y: 78, r: 22 },
  { id: "pattern", type: "pattern", label: "Epuizare spre finalul săptămânii", x: 306, y: 236, r: 21 },
  { id: "value", type: "value", label: "Libertatea de a alege", x: 322, y: 74, r: 20 },
  { id: "goal", type: "goal", label: "Să lucrez fără vinovăție", x: 108, y: 246, r: 20 },
];

const EDGES = [
  { from: "fear", to: "belief", relation: "alimentează" },
  { from: "belief", to: "pattern", relation: "duce la" },
  { from: "value", to: "belief", relation: "intră în conflict cu" },
  { from: "goal", to: "belief", relation: "se lovește de" },
];

const COLORS: Record<NodeType, string> = {
  belief: "var(--belief)",
  value: "var(--value)",
  emotion: "var(--emotion)",
  goal: "var(--goal)",
  pattern: "var(--pattern)",
  fear: "var(--fear)",
  relationship: "var(--relationship)",
};

const byId = new Map(NODES.map((n) => [n.id, n]));

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

        <circle cx="200" cy="152" r="150" fill="url(#glow)" />

        {/* Etapa 2: conexiunile. Până atunci nodurile plutesc neconectate. */}
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
          const isFocus = node.id === "belief";
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
                fill={COLORS[node.type]}
                fillOpacity={isFocus && stage >= 1 ? 0.24 : 0.13}
                stroke={COLORS[node.type]}
                strokeOpacity={isFocus && stage >= 1 ? 0.85 : 0.4}
                strokeWidth={isFocus && stage >= 1 ? 1.5 : 1}
                className="transition-all duration-700"
              />
              <text
                x={node.x}
                y={node.y + node.r + 15}
                textAnchor="middle"
                className="fill-paper-dim text-[9px]"
              >
                {node.label.length > 26 ? `${node.label.slice(0, 25)}…` : node.label}
              </text>
              <text
                x={node.x}
                y={node.y + node.r + 25}
                textAnchor="middle"
                className="fill-paper-faint text-[7px] uppercase tracking-[0.14em]"
              >
                {NODE_TYPE_LABELS[node.type]}
              </text>
            </g>
          );
        })}

        {/* Etapa 2: verdictul utilizatorului peste nodul central. */}
        {stage >= 1 && (
          <g className="animate-fade-up">
            <rect
              x={152}
              y={100}
              width={96}
              height={18}
              rx={9}
              fill="var(--ink)"
              stroke="var(--value)"
              strokeOpacity={0.5}
            />
            <text
              x={200}
              y={112}
              textAnchor="middle"
              className="fill-paper text-[8px] tracking-wide"
            >
              ✓ confirmat de tine
            </text>
          </g>
        )}
      </svg>

      {/* Etapa 3: recomandările, legate de nodul confirmat. */}
      {stage >= 2 && (
        <div className="animate-fade-up absolute right-0 bottom-0 w-[74%] rounded-xl border border-ink-line bg-ink-soft/95 p-3 backdrop-blur-sm sm:w-[62%]">
          <p className="text-[10px] tracking-[0.16em] text-paper-faint uppercase">
            Pentru convingerea confirmată
          </p>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-paper-dim">
            <li>
              <span className="text-paper">Exercițiu</span> · Predă o singură sarcină la
              90% și notează ce s-a întâmplat de fapt
            </li>
            <li>
              <span className="text-paper">Carte</span> · Darurile imperfecțiunii, Brené
              Brown
            </li>
            <li>
              <span className="text-paper">Film</span> · Whiplash (2014) — aceeași
              convingere, dusă până la capăt
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
