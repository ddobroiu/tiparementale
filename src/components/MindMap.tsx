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
import { useMemo, useRef, useState } from "react";

import type { Edge, LifeDomain, MindNode } from "@/lib/types";
import { BrainBackdrop } from "./BrainBackdrop";
import { DOMAIN_COLORS, DOMAIN_LABELS, changeDegree, displayLabel } from "@/lib/types";

const WIDTH = 1000;
const HEIGHT = 700;

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
function domainAnchors(domains: LifeDomain[]): Map<LifeDomain, { x: number; y: number }> {
  const radius = Math.min(WIDTH, HEIGHT) * 0.34;
  return new Map(
    domains.map((domain, i) => {
      const angle = (i / domains.length) * Math.PI * 2 - Math.PI / 2;
      return [
        domain,
        {
          x: WIDTH / 2 + Math.cos(angle) * radius,
          y: HEIGHT / 2 + Math.sin(angle) * radius,
        },
      ];
    }),
  );
}

/** Raza spune cât de sigur este tiparul. Un nod slab arată slab. */
function radius(node: MindNode): number {
  return 16 + node.confidence * 20;
}

interface Props {
  nodes: MindNode[];
  edges: Edge[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Nodurile apărute în ultima conversație — se aprind. */
  highlighted: Set<string>;
}

export function MindMap({ nodes, edges, selectedId, onSelect, highlighted }: Props) {
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const dragState = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  // Layout-ul este stare derivată din graf, nu un efect secundar: simularea
  // rulează până la capăt o singură dată, iar harta nu se agită pe ecran. Când
  // graful se schimbă, nodurile alunecă spre noua poziție prin tranziție CSS.
  const anchors = useMemo(
    () => domainAnchors([...new Set(nodes.map((n) => n.domain))]),
    [nodes],
  );

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
          .distance(130)
          .strength(0.5),
      )
      .force("charge", forceManyBody().strength(-620))
      // Atracția către ramura proprie ține locul unei forțe de centrare.
      .force("branchX", forceX<SimNode>((d) => anchors.get(d.node.domain)!.x).strength(0.13))
      .force("branchY", forceY<SimNode>((d) => anchors.get(d.node.domain)!.y).strength(0.13))
      .force(
        "collide",
        forceCollide<SimNode>().radius((d) => d.r + 34),
      )
      .stop()
      .tick(320);

    return new Map(
      simNodes.map((n) => [n.id, { x: n.x ?? WIDTH / 2, y: n.y ?? HEIGHT / 2 }]),
    );
  }, [nodes, edges, anchors]);

  function onWheel(event: React.WheelEvent) {
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    setView((v) => ({ ...v, k: Math.min(2.5, Math.max(0.4, v.k * factor)) }));
  }

  function onPointerDown(event: React.PointerEvent) {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    dragState.current = { x: event.clientX, y: event.clientY, vx: view.x, vy: view.y };
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragState.current;
    if (!drag) return;
    setView((v) => ({
      ...v,
      x: drag.vx + (event.clientX - drag.x) / v.k,
      y: drag.vy + (event.clientY - drag.y) / v.k,
    }));
  }

  function endDrag() {
    dragState.current = null;
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-center">
        <div className="max-w-xs">
          <p className="font-serif text-2xl text-paper">Harta ta este goală.</p>
          <p className="mt-3 text-sm leading-relaxed text-paper-dim">
            Spune-mi ce te preocupă în ultima vreme. Nu trebuie să fie ordonat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClick={() => onSelect(null)}
    >
      <g
        transform={`translate(${WIDTH / 2} ${HEIGHT / 2}) scale(${view.k}) translate(${-WIDTH / 2 + view.x} ${-HEIGHT / 2 + view.y})`}
      >
          <BrainBackdrop />

        {/* Numele ramurilor, discret, ca reper de orientare. */}
        {[...anchors].map(([domain, point]) => (
          <text
            key={domain}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            className="pointer-events-none text-[26px] tracking-[0.2em] uppercase"
            fill={DOMAIN_COLORS[domain]}
            fillOpacity={0.075}
          >
            {DOMAIN_LABELS[domain]}
          </text>
        ))}

        {edges.map((edge) => {
          const from = positions.get(edge.from_node);
          const to = positions.get(edge.to_node);
          if (!from || !to) return null;

          const active =
            selectedId === edge.from_node || selectedId === edge.to_node;

          return (
            <g key={edge.id}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#f4f3f0"
                strokeOpacity={active ? 0.5 : 0.13}
                strokeWidth={active ? 1.5 : 1}
                className="transition-all duration-500"
              />
              {active && (
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 6}
                  textAnchor="middle"
                  className="fill-paper-dim text-[11px]"
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
          const dim = selectedId !== null && !isSelected;
          const change = changeDegree(node);
          const peakRadius = 16 + (node.peak_confidence ?? node.confidence) * 20;

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x} ${pos.y})`}
              className="cursor-pointer transition-all duration-700 ease-out"
              style={{ opacity: dim ? 0.32 : 1 }}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(isSelected ? null : node.id);
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
              <circle
                r={r}
                fill={DOMAIN_COLORS[node.domain]}
                fillOpacity={isSelected ? 0.3 : 0.14}
                stroke={DOMAIN_COLORS[node.domain]}
                strokeOpacity={isConfirmed ? 0.95 : 0.42}
                strokeWidth={isConfirmed ? 2 : 1}
                strokeDasharray={isConfirmed ? undefined : "3 3"}
                className="transition-all duration-500"
              />
              <text
                y={r + 18}
                textAnchor="middle"
                className="pointer-events-none fill-paper text-[13px]"
              >
                {displayLabel(node).length > 32
                  ? `${displayLabel(node).slice(0, 31)}…`
                  : displayLabel(node)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
