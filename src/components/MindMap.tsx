"use client";

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";

import type { Edge, LifeDomain, MindNode } from "@/lib/types";
import { BrainBackdrop } from "./BrainBackdrop";
import { NodeGlyph } from "./NodeGlyph";
import {
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  NODE_TYPE_LABELS,
  changeDegree,
  displayLabel,
} from "@/lib/types";

/** Desenul de bază, pe ecran lat. Creierul e trasat în aceste coordonate. */
const WIDTH = 1000;
const HEIGHT = 700;

/** Pe telefon, ecranul e înalt și îngust: harta primește un cadru pe măsură. */
const PORTRAIT_WIDTH = 520;
const PORTRAIT_HEIGHT = 1000;

const PORTRAIT_QUERY = "(max-width: 639px)";

/** Culoarea lucrului încheiat: aceeași pe hartă, în panou și în legendă. */
const RESOLVED = "#a0e7c4";

/**
 * Răspunde la întrebarea „e ecran de telefon?” fără efecte și fără stare
 * scrisă din efect: browserul e sursa, React doar se abonează la ea.
 */
function usePortrait(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(PORTRAIT_QUERY);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => window.matchMedia(PORTRAIT_QUERY).matches,
    () => false,
  );
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  node: MindNode;
  r: number;
}

/**
 * Fiecare domeniu primește un punct de atracție propriu, așezat pe un cerc.
 * Așa harta capătă ramuri vizibile — banii într-o parte, relațiile în alta —
 * în loc de un ghem în care totul se amestecă.
 */
function domainAnchors(
  domains: LifeDomain[],
  width: number,
  height: number,
): Map<LifeDomain, { x: number; y: number }> {
  // Pe ecran lat, un cerc. Pe ecran înalt, o elipsă care urmează forma
  // ecranului — altfel ramurile ar ieși pe laterale și ar rămâne loc gol sus și jos.
  const portrait = height > width;
  const rx = portrait ? width * 0.36 : Math.min(width, height) * 0.34;
  const ry = portrait ? height * 0.3 : rx;
  return new Map(
    domains.map((domain, i) => {
      const angle = (i / domains.length) * Math.PI * 2 - Math.PI / 2;
      return [
        domain,
        {
          x: width / 2 + Math.cos(angle) * rx,
          y: height / 2 + Math.sin(angle) * ry,
        },
      ];
    }),
  );
}

/**
 * Raza spune cât de sigur este tiparul. Un nod slab arată slab.
 *
 * Punctele sunt mici deliberat: o hartă de cercuri mari cu text sub fiecare
 * devine ilizibilă la treizeci de noduri. Aici forma se citește de aproape,
 * iar de departe rămâne o rețea de puncte — ceea ce și este.
 */
function radius(node: MindNode): number {
  return 7 + node.confidence * 11;
}

const MAX_LABEL = 34;

function shortLabel(node: MindNode): string {
  const label = displayLabel(node);
  return label.length > MAX_LABEL ? `${label.slice(0, MAX_LABEL - 1)}…` : label;
}

/** Lățimea plăcuței din spatele etichetei, estimată din numărul de caractere. */
function labelWidth(node: MindNode): number {
  return shortLabel(node).length * 5.6 + 16;
}

const WRAP_CHARS = 30;

/**
 * Numele întreg, rupt pe rânduri la spații. Nodul selectat merită tot numele:
 * o convingere tăiată la jumătate nu se poate recunoaște.
 */
function wrapLabel(text: string): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > WRAP_CHARS) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

/** Fără diacritice și fără majuscule: căutarea nu trebuie să ceară precizie. */
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

interface Props {
  nodes: MindNode[];
  edges: Edge[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Nodurile apărute în ultima conversație — se aprind. */
  highlighted: Set<string>;
  /** Ramura pe care e pusă atenția. Restul se estompează, nu dispar. */
  focusDomain: LifeDomain | null;
  /** Căutare liberă în etichete. */
  query: string;
}

export function MindMap({
  nodes,
  edges,
  selectedId,
  onSelect,
  highlighted,
  focusDomain,
  query,
}: Props) {
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dragState = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const moved = useRef(false);

  const portrait = usePortrait();
  const W = portrait ? PORTRAIT_WIDTH : WIDTH;
  const H = portrait ? PORTRAIT_HEIGHT : HEIGHT;

  const anchors = useMemo(
    () => domainAnchors([...new Set(nodes.map((n) => n.domain))], W, H),
    [nodes, W, H],
  );

  // Layout-ul este stare derivată din graf, nu un efect secundar: simularea
  // rulează până la capăt o singură dată, iar harta nu se agită pe ecran. Când
  // graful se schimbă, nodurile alunecă spre noua poziție prin tranziție CSS.
  const positions = useMemo(() => {
    const simNodes: SimNode[] = nodes.map((node) => ({
      id: node.id,
      node,
      r: radius(node),
    }));

    if (simNodes.length === 0) return new Map<string, { x: number; y: number }>();

    const index = new Set(simNodes.map((n) => n.id));
    const simLinks: SimulationLinkDatum<SimNode>[] = edges
      .filter((e) => index.has(e.from_node) && index.has(e.to_node))
      .map((e) => ({ source: e.from_node, target: e.to_node }));

    forceSimulation(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
          .id((d) => d.id)
          .distance(105)
          .strength(0.5),
      )
      .force("charge", forceManyBody().strength(-380))
      // Atracția către ramura proprie ține locul unei forțe de centrare.
      .force("branchX", forceX<SimNode>((d) => anchors.get(d.node.domain)!.x).strength(0.13))
      .force("branchY", forceY<SimNode>((d) => anchors.get(d.node.domain)!.y).strength(0.13))
      .force(
        "collide",
        forceCollide<SimNode>().radius((d) => d.r + 26),
      )
      .stop()
      .tick(320);

    return new Map(
      simNodes.map((n) => [n.id, { x: n.x ?? W / 2, y: n.y ?? H / 2 }]),
    );
  }, [nodes, edges, anchors, W, H]);

  /**
   * Vecinii nodului atins acum. Trecerea cu mâna peste un nod stinge restul
   * hărții și lasă vizibil doar ce ține de el — cea mai rapidă cale de a
   * răspunde la „ce are asta de-a face cu ce?".
   */
  const neighbours = useMemo(() => {
    const focus = hoveredId ?? selectedId;
    if (!focus) return null;

    const set = new Set<string>([focus]);
    for (const edge of edges) {
      if (edge.from_node === focus) set.add(edge.to_node);
      if (edge.to_node === focus) set.add(edge.from_node);
    }
    return set;
  }, [hoveredId, selectedId, edges]);

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return null;
    return new Set(
      nodes.filter((n) => normalize(displayLabel(n)).includes(q)).map((n) => n.id),
    );
  }, [query, nodes]);

  function onWheel(event: React.WheelEvent) {
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    setView((v) => ({ ...v, k: Math.min(3, Math.max(0.35, v.k * factor)) }));
  }

  /** Degetele de pe ecran, ca să deosebim trasul de ciupit. */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; k: number } | null>(null);

  function pinchDistance(): number {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function onPointerDown(event: React.PointerEvent) {
    // Captura rămâne pe elementul atins, nu pe svg: altfel click-ul ajunge la
    // svg, care deselectează, iar nodul nu se deschide niciodată.
    (event.target as Element).setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2) {
      // Al doilea deget: trasul devine ciupire. Pe telefon nu există rotiță.
      pinch.current = { distance: pinchDistance(), k: view.k };
      dragState.current = null;
      moved.current = true;
      return;
    }

    dragState.current = { x: event.clientX, y: event.clientY, vx: view.x, vy: view.y };
    moved.current = false;
  }

  function onPointerMove(event: React.PointerEvent) {
    if (pointers.current.has(event.pointerId)) {
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (pinch.current && pointers.current.size === 2) {
      const ratio = pinchDistance() / pinch.current.distance;
      const k = Math.min(3, Math.max(0.35, pinch.current.k * ratio));
      setView((v) => ({ ...v, k }));
      return;
    }

    const drag = dragState.current;
    if (!drag) return;

    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true;

    setView((v) => ({ ...v, x: drag.vx + dx / v.k, y: drag.vy + dy / v.k }));
  }

  function endDrag(event?: React.PointerEvent) {
    if (event) pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) dragState.current = null;
  }

  const zoom = (factor: number) =>
    setView((v) => ({ ...v, k: Math.min(3, Math.max(0.35, v.k * factor)) }));

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-center">
        <div className="max-w-xs">
          <p className="font-serif text-2xl text-paper">Harta ta este goală.</p>
          <p className="mt-3 text-sm leading-relaxed text-paper-dim">
            Pasul 1, Identificare: începe o ședință. Din ce povestești, aici apar
            convingerile, valorile și fricile tale.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Cadrul urmează ecranul: lat pe calculator, înalt pe telefon. Așa nimic
          nu rămâne tăiat pe laterale și nodurile au dimensiune de atins. */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClick={() => {
          // O tragere de hartă nu trebuie să închidă nodul deschis.
          if (!moved.current) onSelect(null);
        }}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 7 4 L 0 7 z" fill="#f2f5fa" fillOpacity={0.45} />
          </marker>
        </defs>

        <g
          transform={`translate(${W / 2} ${H / 2}) scale(${view.k}) translate(${-W / 2 + view.x} ${-H / 2 + view.y})`}
        >
          {/* Creierul e desenat pentru cadrul lat; în portret îl aducem la lățimea
              cadrului (puțin peste, ca să umple fundalul) și îl așezăm la mijloc. */}
          <g
            transform={
              portrait
                ? `translate(${W / 2} ${H / 2}) scale(${(W / WIDTH) * 1.35}) translate(${-WIDTH / 2} ${-HEIGHT / 2})`
                : undefined
            }
          >
            <BrainBackdrop />
          </g>

          {/* Numele ramurilor, discret, ca reper de orientare. */}
          {[...anchors].map(([domain, point]) => (
            <text
              key={domain}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              className="pointer-events-none text-[26px] tracking-[0.2em] uppercase transition-opacity duration-500"
              fill={DOMAIN_COLORS[domain]}
              fillOpacity={focusDomain === null || focusDomain === domain ? 0.09 : 0.03}
            >
              {DOMAIN_LABELS[domain]}
            </text>
          ))}

          {edges.map((edge) => {
            const from = positions.get(edge.from_node);
            const to = positions.get(edge.to_node);
            if (!from || !to) return null;

            const active =
              selectedId === edge.from_node ||
              selectedId === edge.to_node ||
              hoveredId === edge.from_node ||
              hoveredId === edge.to_node;

            const dim = neighbours !== null && !active;

            // Curbă ușoară în loc de linie dreaptă: două legături între aceleași
            // zone nu se mai suprapun, iar săgeata spune cine pe cine hrănește.
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            const nx = -(to.y - from.y) * 0.12;
            const ny = (to.x - from.x) * 0.12;

            return (
              <g
                key={edge.id}
                className="transition-opacity duration-300"
                style={{ opacity: dim ? 0.12 : 1 }}
              >
                <path
                  d={`M ${from.x} ${from.y} Q ${mx + nx} ${my + ny} ${to.x} ${to.y}`}
                  fill="none"
                  stroke="#f2f5fa"
                  strokeOpacity={active ? 0.42 : 0.1}
                  strokeWidth={active ? 1.4 : 0.8}
                  markerEnd={active ? "url(#arrow)" : undefined}
                  className="transition-all duration-300"
                />
                {/* Impulsul care trece prin legătura atinsă. */}
                {active && (
                  <path
                    d={`M ${from.x} ${from.y} Q ${mx + nx} ${my + ny} ${to.x} ${to.y}`}
                    fill="none"
                    stroke={DOMAIN_COLORS.self}
                    strokeOpacity={0.75}
                    strokeWidth={1.4}
                    className="edge-pulse"
                  />
                )}
                {active && (
                  <text
                    x={mx + nx * 0.7}
                    y={my + ny * 0.7 - 6}
                    textAnchor="middle"
                    className="pointer-events-none fill-paper-dim text-[11px]"
                  >
                    {edge.relation}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;

            const r = radius(node);
            const isSelected = selectedId === node.id;
            const isNew = highlighted.has(node.id);
            const isConfirmed = node.verdict === "confirmed" || node.verdict === "edited";
            const change = changeDegree(node);
            const peakRadius = 16 + (node.peak_confidence ?? node.confidence) * 20;

            const offBranch = focusDomain !== null && node.domain !== focusDomain;
            const offNeighbourhood = neighbours !== null && !neighbours.has(node.id);
            const offSearch = matches !== null && !matches.has(node.id);
            const opacity = offBranch || offNeighbourhood || offSearch ? 0.16 : 1;

            const isHovered = hoveredId === node.id;
            const isActive = isHovered || isSelected;

            // Eticheta apare doar când o ceri. Treizeci de noduri cu text sub
            // fiecare nu se pot citi; treizeci de puncte, da — iar textul e la
            // un deget distanță.
            const showLabel = isActive || isNew || matches?.has(node.id);

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x} ${pos.y})`}
                className="cursor-pointer transition-all duration-500 ease-out"
                style={{ opacity }}
                onPointerEnter={() => setHoveredId(node.id)}
                onPointerLeave={() => setHoveredId(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!moved.current) onSelect(isSelected ? null : node.id);
                }}
              >
                {isNew && (
                  <circle
                    r={r + 12}
                    fill={DOMAIN_COLORS[node.domain]}
                    fillOpacity={0.12}
                    style={{ animation: "node-appear 0.9s ease-out both" }}
                  />
                )}

                {matches?.has(node.id) && (
                  <circle
                    r={r + 8}
                    fill="none"
                    stroke="#f2f5fa"
                    strokeOpacity={0.5}
                  />
                )}

                {/* Umbra a ceea ce a fost: cercul de la vârf rămâne desenat, ca
                    slăbirea convingerii să se vadă, nu doar să se citească. */}
                {change.weakened && (
                  <circle
                    r={peakRadius}
                    fill="none"
                    stroke={DOMAIN_COLORS[node.domain]}
                    strokeOpacity={0.28}
                    strokeDasharray="2 5"
                  />
                )}

                {/* Halo: dă punctului adâncime și îl face ținta mai ușor de
                    atins cu degetul, fără să mărească nodul însuși. */}
                <circle
                  r={r + 10}
                  fill={DOMAIN_COLORS[node.domain]}
                  fillOpacity={isActive ? 0.14 : 0.05}
                  className="transition-all duration-300"
                />

                {/* Lucrul pe convingere se vede pe hartă: inel punctat cât se
                    exersează, verde plin cu bifă când e rezolvată. */}
                {node.work_status === "working" && (
                  <circle
                    r={r + 5}
                    fill="none"
                    stroke={RESOLVED}
                    strokeOpacity={0.9}
                    strokeWidth={1.3}
                    strokeDasharray="3 3"
                    className="work-ring"
                  />
                )}

                {/* Forma spune ce fel de lucru este; culoarea, din ce zonă vine. */}
                <NodeGlyph
                  type={node.type}
                  r={r}
                  color={node.work_status === "resolved" ? RESOLVED : DOMAIN_COLORS[node.domain]}
                  fillOpacity={node.work_status === "resolved" ? 0.9 : isActive ? 0.75 : 0.42}
                  strokeOpacity={isConfirmed ? 1 : 0.5}
                  strokeWidth={isConfirmed ? 1.6 : 1}
                  dashed={!isConfirmed}
                />

                {node.work_status === "resolved" && (
                  <text
                    y={4}
                    textAnchor="middle"
                    className="pointer-events-none fill-ink text-[11px] font-bold"
                  >
                    ✓
                  </text>
                )}

                {showLabel && !isSelected && (
                  <g className="animate-fade-up pointer-events-none">
                    {/* Fundal sub text: altfel eticheta se pierde peste linii
                        și peste conturul creierului. */}
                    <rect
                      x={-labelWidth(node) / 2}
                      y={r + 7}
                      width={labelWidth(node)}
                      height={19}
                      rx={9.5}
                      fill="#0a1424"
                      fillOpacity={0.86}
                    />
                    <text
                      y={r + 20}
                      textAnchor="middle"
                      className="fill-paper text-[11px]"
                    >
                      {shortLabel(node)}
                    </text>
                  </g>
                )}

                {/* Selectat: numele întreg, pe rânduri, cu tipul lui deasupra. */}
                {isSelected &&
                  (() => {
                    const lines = wrapLabel(displayLabel(node));
                    const width = Math.max(...lines.map((l) => l.length), 10) * 6 + 20;
                    const height = lines.length * 14 + 24;
                    return (
                      <g className="animate-fade-up pointer-events-none">
                        <rect
                          x={-width / 2}
                          y={r + 7}
                          width={width}
                          height={height}
                          rx={10}
                          fill="#0a1424"
                          fillOpacity={0.92}
                          stroke={DOMAIN_COLORS[node.domain]}
                          strokeOpacity={0.5}
                        />
                        <text
                          y={r + 20}
                          textAnchor="middle"
                          className="fill-paper-faint text-[9px] tracking-[0.14em] uppercase"
                        >
                          {NODE_TYPE_LABELS[node.type]} · {DOMAIN_LABELS[node.domain]}
                        </text>
                        <text textAnchor="middle" className="fill-paper text-[11px]">
                          {lines.map((line, i) => (
                            <tspan key={i} x={0} y={r + 34 + i * 14}>
                              {line}
                            </tspan>
                          ))}
                        </text>
                      </g>
                    );
                  })()}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Comenzi de vizualizare: rotița mouse-ului nu există pe telefon. */}
      {/* Pe telefon zoom-ul se face din două degete; butoanele ar sta peste foaia de jos. */}
      <div className="absolute right-6 bottom-6 z-10 hidden flex-col gap-1 sm:flex">
        <button
          onClick={() => zoom(1.25)}
          className="h-9 w-9 rounded-lg border border-ink-line bg-ink-soft/80 text-paper-dim backdrop-blur-md transition-colors hover:border-paper-faint hover:text-paper"
          aria-label="Apropie"
        >
          +
        </button>
        <button
          onClick={() => zoom(1 / 1.25)}
          className="h-9 w-9 rounded-lg border border-ink-line bg-ink-soft/80 text-paper-dim backdrop-blur-md transition-colors hover:border-paper-faint hover:text-paper"
          aria-label="Depărtează"
        >
          −
        </button>
        <button
          onClick={() => setView({ x: 0, y: 0, k: 1 })}
          className="h-9 w-9 rounded-lg border border-ink-line bg-ink-soft/80 text-xs text-paper-dim backdrop-blur-md transition-colors hover:border-paper-faint hover:text-paper"
          aria-label="Încadrează harta"
        >
          ⤢
        </button>
      </div>
    </div>
  );
}
