"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import type { Edge, MapDiff, MindNode, SafetyFlag } from "@/lib/types";
import { ChatPanel, type ChatMessage } from "./ChatPanel";
import { MindMap } from "./MindMap";
import { NodeDetail } from "./NodeDetail";

interface Props {
  initialNodes: MindNode[];
  initialEdges: Edge[];
}

export function MapView({ initialNodes, initialEdges }: Props) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(initialNodes.length === 0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [diff, setDiff] = useState<MapDiff | null>(null);
  const [safety, setSafety] = useState<SafetyFlag>("none");
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    const res = await fetch("/api/graph");
    if (!res.ok) return;
    const data = await res.json();
    setNodes(data.nodes);
    setEdges(data.edges);
  }, []);

  async function send(text: string) {
    setMessages((m) => [...m, { role: "user", content: text }]);
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.error ?? "Ceva n-a mers. Încearcă din nou." },
        ]);
        return;
      }

      setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      setSafety(data.safetyFlag ?? "none");

      const mapDiff = data.diff as MapDiff;
      const changed =
        mapDiff.created.length + mapDiff.strengthened.length + mapDiff.connected.length;

      if (changed > 0) {
        setHighlighted(new Set(mapDiff.created.map((n) => n.id)));
        setDiff(mapDiff);
        await reload();
      }
    } finally {
      setPending(false);
    }
  }

  /** Închiderea conversației te lasă întotdeauna în hartă, cu ce s-a schimbat. */
  function closeChat() {
    setChatOpen(false);
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="relative flex-1">
        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5">
          <Link href="/" className="font-serif text-lg tracking-tight">
            Tipare Mentale
          </Link>
          <span className="text-xs text-paper-faint">
            {nodes.length} {nodes.length === 1 ? "element" : "elemente"}
          </span>
        </header>

        <MindMap
          nodes={nodes}
          edges={edges}
          selectedId={selectedId}
          onSelect={setSelectedId}
          highlighted={highlighted}
        />

        {/* Momentul în care harta arată ce s-a schimbat. */}
        {diff && !chatOpen && (
          <div className="animate-fade-up absolute top-20 left-1/2 w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border border-ink-line bg-ink-soft/95 p-4 backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs tracking-[0.16em] text-paper-faint uppercase">
                Harta s-a schimbat
              </p>
              <button
                onClick={() => {
                  setDiff(null);
                  setHighlighted(new Set());
                }}
                className="text-paper-faint hover:text-paper"
                aria-label="Închide"
              >
                ✕
              </button>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-paper-dim">
              {diff.created.map((n) => (
                <li key={n.id}>
                  <span className="text-paper">Nou</span> · {n.label}
                </li>
              ))}
              {diff.strengthened.map((n) => (
                <li key={n.id}>
                  <span className="text-paper">S-a întărit</span> · {n.label} (
                  {Math.round(n.confidence * 100)}%)
                </li>
              ))}
              {diff.connected.length > 0 && (
                <li>
                  <span className="text-paper">Conexiuni noi</span> ·{" "}
                  {diff.connected.length}
                </li>
              )}
            </ul>
            <p className="mt-3 text-xs text-paper-faint">
              Deschide un element ca să vezi din ce a fost dedus — și spune-mi dacă
              am nimerit.
            </p>
          </div>
        )}

        {safety !== "none" && (
          <div className="absolute inset-x-0 bottom-24 flex justify-center px-6">
            <p className="rounded-full border border-ink-line bg-ink-soft/95 px-5 py-2 text-center text-xs text-paper-dim backdrop-blur-md">
              Dacă îți este greu acum, poți suna la 0800 801 200 — gratuit, non-stop.
            </p>
          </div>
        )}

        <ChatPanel
          open={chatOpen}
          messages={messages}
          pending={pending}
          onSend={send}
          onOpen={() => setChatOpen(true)}
          onClose={closeChat}
        />
      </div>

      {selectedId && (
        <NodeDetail
          key={selectedId}
          nodeId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}
