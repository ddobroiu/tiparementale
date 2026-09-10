"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import type { Edge, LifeDomain, MapDiff, MindNode, SafetyFlag } from "@/lib/types";
import { ChatPanel, type ChatMessage } from "./ChatPanel";
import { MindMap } from "./MindMap";
import { NodeDetail } from "./NodeDetail";
import { Logo } from "./Logo";
import { GuidePicker } from "./GuidePicker";
import type { Guide } from "@/lib/guides";
import { MapLegend } from "./MapLegend";
import { MapFilters, NO_FILTERS, applyFilters, type Filters } from "./MapFilters";
import { MapToolbar } from "./MapToolbar";
import { PredictionPanel } from "./PredictionPanel";
import { SimilarityPrompt, type SimilarPair } from "./SimilarityPrompt";
import { MapReading } from "./MapReading";
import { AddNodeForm } from "./AddNodeForm";
import type { Topic } from "@/lib/topics";

export interface AccountSummary {
  sessionsLeft: number;
  transformationsLeft: number;
}

interface Props {
  initialNodes: MindNode[];
  initialEdges: Edge[];
  initialAccount: AccountSummary;
  initialSimilarPairs: SimilarPair[];
  /** Omul s-a întors de la plată: confirmăm, ca să nu se întrebe dacă a mers. */
  justPaid?: boolean;
}

const EMPTY_DIFF: MapDiff = { created: [], strengthened: [], connected: [] };

function diffSize(diff: MapDiff): number {
  return diff.created.length + diff.strengthened.length + diff.connected.length;
}

export function MapView({
  initialNodes,
  initialEdges,
  initialAccount,
  initialSimilarPairs,
  justPaid = false,
}: Props) {
  const [paidNotice, setPaidNotice] = useState(justPaid);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Închis la început, chiar și pe harta goală: omul nou trebuie să vadă întâi
  // „pe ce vrei să lucrezi", nu un cursor gol. Un chat deschis peste selectorul
  // de teme îl ascundea exact utilizatorilor pentru care a fost făcut.
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [diff, setDiff] = useState<MapDiff | null>(null);
  const [safety, setSafety] = useState<SafetyFlag>("none");
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState<{ reason: string; code: string } | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [focusDomain, setFocusDomain] = useState<LifeDomain | null>(null);
  const [query, setQuery] = useState("");
  // Contul vine de pe server, cu prima randare: fără efect la montare și fără
  // licărire în care numărul de ședințe lipsește.
  const [account, setAccount] = useState<AccountSummary>(initialAccount);

  const loadAccount = useCallback(async () => {
    const res = await fetch("/api/account");
    if (res.ok) setAccount(await res.json());
  }, []);

  const reload = useCallback(async () => {
    const res = await fetch("/api/graph");
    if (!res.ok) return;
    const data = await res.json();
    setNodes(data.nodes);
    setEdges(data.edges);
  }, []);

  /**
   * Extracția rulează separat de conversație, pe mai multe replici odată.
   * Harta se schimbă astfel în salturi vizibile, nu în micro-mișcări după
   * fiecare propoziție.
   */
  const runExtraction = useCallback(
    async (id: string) => {
      setExtracting(true);
      try {
        const res = await fetch(`/api/conversations/${id}/extract`, { method: "POST" });
        if (!res.ok) return;

        const data = await res.json();
        const mapDiff: MapDiff = data.diff ?? EMPTY_DIFF;

        if (diffSize(mapDiff) > 0) {
          setHighlighted(new Set(mapDiff.created.map((n) => n.id)));
          setDiff(mapDiff);
          await reload();
        }
      } finally {
        setExtracting(false);
      }
    },
    [reload],
  );

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

      // 402: ședința s-a umplut sau planul s-a epuizat. Nu este o eroare de
      // conversație, deci nu apare ca replică — apare ca stare a panoului.
      if (res.status === 402) {
        setLimit({ reason: data.error, code: data.code });
        setMessages((m) => m.slice(0, -1));
        return;
      }

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.error ?? "Ceva n-a mers. Încearcă din nou." },
        ]);
        return;
      }

      setConversationId(data.conversationId);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply, options: data.options ?? null },
      ]);
      setSafety(data.safetyFlag ?? "none");

      if (data.extractionDue) void runExtraction(data.conversationId);
      if (typeof data.turnsLeft === "number" && data.turnsLeft <= 0) {
        setLimit({
          reason:
            "Ședința aceasta s-a încheiat. Închide panoul ca să vezi ce s-a " +
            "schimbat în hartă.",
          code: "session_full",
        });
      }
      void loadAccount();
    } finally {
      setPending(false);
    }
  }

  /** Deschide o ședință pe un subiect ales, cu întrebarea gata formulată. */
  async function startTopic(topic: Topic, domain: LifeDomain) {
    setPending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: topic.id, domain }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setLimit({ reason: data.error, code: data.code });
        setChatOpen(true);
        return;
      }
      if (!res.ok) return;

      setConversationId(data.conversationId);
      setMessages(
        data.opener
          ? [{ role: "assistant", content: data.opener, options: data.options ?? null }]
          : [],
      );
      setChatOpen(true);
      void loadAccount();
    } finally {
      setPending(false);
    }
  }

  /**
   * Deschide o ședință pe un ghid: o temă cu parcurs, gândită după literatura
   * de specialitate. Prima întrebare vine gata scrisă, cu variantele ei.
   */
  async function startGuide(guide: Guide) {
    setPending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guideId: guide.id }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setLimit({ reason: data.error, code: data.code });
        setChatOpen(true);
        return;
      }
      if (!res.ok) return;

      setConversationId(data.conversationId);
      setMessages(
        data.opener
          ? [{ role: "assistant", content: data.opener, options: data.options ?? null }]
          : [],
      );
      setChatOpen(true);
      void loadAccount();
    } finally {
      setPending(false);
    }
  }

  /** Închiderea conversației te lasă în hartă, cu tot ce s-a spus prelucrat. */
  async function closeChat() {
    setChatOpen(false);
    setLimit(null);
    setMessages([]);
    setConversationId(null);
    if (conversationId) await runExtraction(conversationId);
    void loadAccount();
  }

  // Filtrele taie și muchiile: o legătură către un nod ascuns ar rămâne
  // atârnând în gol.
  const visibleNodes = applyFilters(nodes, filters);
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = edges.filter(
    (e) => visibleIds.has(e.from_node) && visibleIds.has(e.to_node),
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden sm:flex-row">
      <div className="relative min-w-0 flex-1">
        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/setari"
              className="hidden text-xs text-paper-faint transition-colors hover:text-paper-dim sm:inline"
            >
              Contul
            </Link>
            {/* Fără ședințe, cumpărarea devine acțiunea principală din antet. */}
            {account.sessionsLeft === 0 ? (
              <Link
                href="/pachete"
                className="rounded-full bg-paper px-4 py-1.5 text-xs font-semibold text-ink shadow-lg transition-opacity hover:opacity-90"
              >
                Cumpără ședințe
              </Link>
            ) : (
              <Link
                href="/pachete"
                className="rounded-full border border-ink-line px-3 py-1.5 text-xs text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
              >
                {account.sessionsLeft} {account.sessionsLeft === 1 ? "ședință" : "ședințe"}
              </Link>
            )}
            <span className="hidden text-xs text-paper-faint sm:inline">
              {visibleNodes.length}
              {visibleNodes.length !== nodes.length && ` din ${nodes.length}`}{" "}
              {nodes.length === 1 ? "element" : "elemente"}
            </span>
          </div>
        </header>

        <MindMap
          nodes={visibleNodes}
          edges={visibleEdges}
          selectedId={selectedId}
          onSelect={setSelectedId}
          highlighted={highlighted}
          focusDomain={focusDomain}
          query={query}
        />

        <MapToolbar
          nodes={visibleNodes}
          focusDomain={focusDomain}
          onFocus={setFocusDomain}
          query={query}
          onQuery={setQuery}
        />

        {paidNotice && (
          <div className="animate-fade-up absolute top-20 left-1/2 z-20 w-[min(92vw,24rem)] -translate-x-1/2 rounded-xl border border-[color:var(--value)]/40 bg-ink-soft/95 p-4 backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-paper">
                Plata a reușit. Ședințele sunt în cont — {account.sessionsLeft}{" "}
                {account.sessionsLeft === 1 ? "disponibilă" : "disponibile"}.
              </p>
              <button
                onClick={() => setPaidNotice(false)}
                className="text-paper-faint hover:text-paper"
                aria-label="Închide"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Momentul în care harta arată ce s-a schimbat. */}
        {diff && (
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
                  <span className="text-paper">Conexiuni noi</span> · {diff.connected.length}
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

        {/* Predicțiile stau lângă filtre: amândouă sunt lucruri pe care le
            ceri hărții, nu lucruri pe care ți le spune ea singură. */}
        <div className="absolute top-16 right-4 z-20 flex flex-col items-end gap-2 sm:top-20 sm:right-6">
          <div className="flex flex-wrap justify-end gap-2">
            {/* „Știu deja ceva" e disponibil și pe harta goală: cine își cunoaște
                un tipar nu trebuie să treacă printr-o conversație ca să-l pună. */}
            <AddNodeForm
              onAdded={async (id) => {
                await reload();
                setSelectedId(id);
              }}
            />
            {nodes.length > 0 && (
              <>
                <MapReading onOpenNode={setSelectedId} />
                <PredictionPanel onAnswered={reload} />
              </>
            )}
          </div>
          {initialSimilarPairs.length > 0 && (
            <SimilarityPrompt pairs={initialSimilarPairs} onResolved={reload} />
          )}
        </div>

        <MapFilters nodes={nodes} filters={filters} onChange={setFilters} />

        {nodes.length > 0 && (
          <div className="hidden sm:block">
            <MapLegend nodes={visibleNodes} />
          </div>
        )}

        {!chatOpen && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6">
            <GuidePicker
              nodes={nodes}
              busy={pending}
              onFree={() => setChatOpen(true)}
              onGuide={startGuide}
              onTopic={startTopic}
            />
          </div>
        )}
      </div>

      {chatOpen && (
        <ChatPanel
          messages={messages}
          pending={pending}
          extracting={extracting}
          limit={limit}
          onSend={send}
          onClose={closeChat}
        />
      )}

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
