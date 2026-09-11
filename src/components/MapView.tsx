"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type {
  Edge,
  LifeDomain,
  MapDiff,
  MindNode,
  SafetyFlag,
} from "@/lib/types";
import type { Guide } from "@/lib/guides";
import { getGuide } from "@/lib/guides";
import { lessonNumber, type LessonProgress } from "@/lib/program";
import type { Topic } from "@/lib/topics";
import { ChatPanel, type ChatMessage } from "./ChatPanel";
import { MindMap } from "./MindMap";
import { NodeDetail } from "./NodeDetail";
import { Logo } from "./Logo";
import { MapLegend } from "./MapLegend";
import { NO_FILTERS, applyFilters, type Filters } from "./MapFilters";
import { MapToolbar } from "./MapToolbar";
import type { SimilarPair } from "./SimilarityPrompt";
import {
  TABS,
  Workspace,
  stepStates,
  workspaceCounts,
  type WorkspaceTab,
} from "./Workspace";

export interface AccountSummary {
  sessionsLeft: number;
  transformationsLeft: number;
  /** Ultima ședință pe fiecare lecție: ce e făcut, ce e în curs. */
  lessons: LessonProgress[];
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

/**
 * Ecranul hărții: harta în stânga, panoul de lucru în dreapta.
 *
 * Panoul arată un singur lucru la un moment dat, în ordinea importanței:
 * nodul deschis, dacă e unul; conversația, dacă e una; altfel cele trei
 * etape — Identificare, Interpretare, Transformare. Pe telefon aceleași trei
 * stau într-o bară jos și se ridică ca foi.
 */
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
  const [chatOpen, setChatOpen] = useState(false);
  const [tab, setTab] = useState<WorkspaceTab>("identify");
  // Pe telefon panoul e o foaie care se ridică din bara de jos.
  const [sheetOpen, setSheetOpen] = useState(false);
  // De ce e închis un pas, când omul îl atinge în bara de jos.
  const [stepHint, setStepHint] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [lessonDone, setLessonDone] = useState<{
    created: number;
    strengthened: number;
  } | null>(null);
  const [diff, setDiff] = useState<MapDiff | null>(null);
  const [safety, setSafety] = useState<SafetyFlag>("none");
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState<{ reason: string; code: string } | null>(
    null,
  );
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [focusDomain, setFocusDomain] = useState<LifeDomain | null>(null);
  const [query, setQuery] = useState("");
  const [account, setAccount] = useState<AccountSummary>(initialAccount);

  // Sfatul de pe pasul închis pleacă singur: nu e o eroare, e o îndrumare.
  useEffect(() => {
    if (!stepHint) return;
    const id = setTimeout(() => setStepHint(null), 5000);
    return () => clearTimeout(id);
  }, [stepHint]);

  const loadAccount = useCallback(async () => {
    const res = await fetch("/api/account");
    if (!res.ok) return;
    const data = await res.json();
    setAccount({
      sessionsLeft: data.sessionsLeft,
      transformationsLeft: data.transformationsLeft,
      lessons: data.lessons ?? [],
    });
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
    async (id: string): Promise<MapDiff> => {
      setExtracting(true);
      try {
        const res = await fetch(`/api/conversations/${id}/extract`, {
          method: "POST",
        });
        if (!res.ok) return EMPTY_DIFF;

        const data = await res.json();
        const mapDiff: MapDiff = data.diff ?? EMPTY_DIFF;

        if (diffSize(mapDiff) > 0) {
          setHighlighted(new Set(mapDiff.created.map((n) => n.id)));
          setDiff(mapDiff);
          await reload();
        }
        return mapDiff;
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
          {
            role: "assistant",
            content: data.error ?? "Ceva n-a mers. Încearcă din nou.",
          },
        ]);
        return;
      }

      setConversationId(data.conversationId);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply,
          options: data.options ?? null,
        },
      ]);
      setSafety(data.safetyFlag ?? "none");

      if (data.guideComplete) {
        // Sfârșitul lecției: harta se actualizează acum, iar omul vede bilanțul
        // înainte să decidă dacă se întoarce pe hartă sau mai vorbește.
        const mapDiff = await runExtraction(data.conversationId);
        setLessonDone({
          created: mapDiff.created.length,
          strengthened: mapDiff.strengthened.length,
        });
        void loadAccount();
        return;
      }

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

  /** Deschide o ședință — pe un ghid cu parcurs, sau pe un subiect scurt. */
  async function startConversation(body: Record<string, unknown>) {
    setPending(true);
    setSheetOpen(false);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 402) {
        setLimit({ reason: data.error, code: data.code });
        setChatOpen(true);
        return;
      }
      if (!res.ok) return;

      setConversationId(data.conversationId);
      setLessonDone(null);
      setChatTitle(titleFor(body.guideId as string | undefined));
      setMessages(
        data.opener
          ? [
              {
                role: "assistant",
                content: data.opener,
                options: data.options ?? null,
              },
            ]
          : [],
      );
      setSelectedId(null);
      setChatOpen(true);
      void loadAccount();
    } finally {
      setPending(false);
    }
  }

  /** „Lecția 3 · Relația cu tata”, sau nimic pentru conversația liberă. */
  function titleFor(guideId: string | null | undefined): string | null {
    if (!guideId) return null;
    const guide = getGuide(guideId);
    if (!guide) return null;
    const n = lessonNumber(guideId);
    return n ? `Lecția ${n} · ${guide.title}` : guide.title;
  }

  /** Reia o lecție începută: mesajele vin din bază, ședința nu se plătește iar. */
  async function resumeLesson(id: string) {
    setPending(true);
    setSheetOpen(false);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.closed) {
        // Închisă înainte de final: se redeschide, ședința e deja plătită.
        const reopened = await fetch(`/api/conversations/${id}/reopen`, {
          method: "POST",
        });
        if (!reopened.ok) return;
      }
      setConversationId(data.conversationId);
      setLessonDone(null);
      setChatTitle(titleFor(data.guideId));
      setMessages(
        (data.messages as ChatMessage[]).map((m) => ({
          role: m.role,
          content: m.content,
          options: m.options ?? null,
        })),
      );
      setLimit(null);
      setSelectedId(null);
      setChatOpen(true);
    } finally {
      setPending(false);
    }
  }

  const startGuide = (guide: Guide) => startConversation({ guideId: guide.id });
  const startTopic = (topic: Topic, domain: LifeDomain) =>
    startConversation({ topicId: topic.id, domain });

  function startFree() {
    setSheetOpen(false);
    setSelectedId(null);
    setChatTitle(null);
    setLessonDone(null);
    setChatOpen(true);
  }

  /** Închiderea conversației te lasă în hartă, cu tot ce s-a spus prelucrat. */
  async function closeChat() {
    const id = conversationId;
    setChatOpen(false);
    setLimit(null);
    setMessages([]);
    setConversationId(null);
    setChatTitle(null);
    setLessonDone(null);
    // După o ședință, următorul pas firesc e să confirmi ce a apărut.
    setTab("interpret");
    if (id) {
      // Închisă înseamnă bifată în program. Extracția rulează după.
      await fetch(`/api/conversations/${id}/close`, { method: "POST" }).catch(
        () => {},
      );
      await runExtraction(id);
    }
    void loadAccount();
  }

  function openNode(id: string | null) {
    setSelectedId(id);
    if (id) setSheetOpen(false);
  }

  function openTab(next: WorkspaceTab) {
    setStepHint(null);
    setTab(next);
    setSheetOpen(true);
  }

  // Filtrele taie și muchiile: o legătură către un nod ascuns ar rămâne
  // atârnând în gol.
  const visibleNodes = applyFilters(nodes, filters);
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = edges.filter(
    (e) => visibleIds.has(e.from_node) && visibleIds.has(e.to_node),
  );
  const counts = workspaceCounts(nodes);
  const steps = stepStates(counts);

  const workspace = (onClose?: () => void) => (
    <Workspace
      tab={tab}
      onTab={setTab}
      nodes={nodes}
      account={account}
      pending={pending}
      similarPairs={initialSimilarPairs}
      filters={filters}
      onFilters={setFilters}
      onFree={startFree}
      onGuide={startGuide}
      onResume={resumeLesson}
      onTopic={startTopic}
      onOpenNode={openNode}
      onChanged={reload}
      onClose={onClose}
    />
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden sm:flex-row">
      <div className="relative min-h-0 min-w-0 flex-1">
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
                className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink shadow-lg transition-opacity hover:opacity-90 sm:py-1.5 sm:text-xs"
              >
                Cumpără ședințe
              </Link>
            ) : (
              <Link
                href="/pachete"
                className="rounded-full border border-ink-line px-3.5 py-2 text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper sm:py-1.5 sm:text-xs"
              >
                {account.sessionsLeft}{" "}
                {account.sessionsLeft === 1 ? "ședință" : "ședințe"}
              </Link>
            )}
          </div>
        </header>

        <MindMap
          nodes={visibleNodes}
          edges={visibleEdges}
          selectedId={selectedId}
          onSelect={openNode}
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
          <div className="animate-fade-up absolute top-20 left-1/2 z-20 w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border border-ink-line bg-ink-soft/95 p-4 backdrop-blur-md">
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
              Pasul următor: Interpretare — deschide un element și spune dacă am
              nimerit.
            </p>
          </div>
        )}

        {safety !== "none" && (
          <div className="absolute inset-x-0 bottom-24 flex justify-center px-6">
            <p className="rounded-full border border-ink-line bg-ink-soft/95 px-5 py-2 text-center text-xs text-paper-dim backdrop-blur-md">
              Dacă îți este greu acum, poți suna la 0800 801 200 — gratuit,
              non-stop.
            </p>
          </div>
        )}

        {nodes.length > 0 && (
          <div className="hidden sm:block">
            <MapLegend nodes={visibleNodes} />
          </div>
        )}

        {/* De ce nu se poate încă: se spune, nu se lasă butonul mut. */}
        {stepHint && !chatOpen && !sheetOpen && (
          <div className="animate-fade-up absolute inset-x-0 bottom-24 z-20 flex justify-center px-4 sm:hidden">
            <button
              onClick={() => setStepHint(null)}
              className="rounded-xl border border-[color:var(--todo)]/40 bg-ink-soft/95 px-4 py-2.5 text-center text-[13px] leading-snug text-[color:var(--todo)] backdrop-blur-md"
            >
              {stepHint}
            </button>
          </div>
        )}

        {/* Telefon: cele trei etape, ca bară jos. Fiecare deschide foaia pe fila ei. */}
        {!chatOpen && !sheetOpen && (
          <nav className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-3 gap-1.5 border-t border-ink-line bg-ink/90 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
            {TABS.map((t) => {
              const state = steps[t.id];
              const badge =
                t.id === "identify"
                  ? account.sessionsLeft
                  : t.id === "interpret"
                    ? counts.unconfirmed
                    : counts.todo + counts.working;
              // Pasul de făcut acum: primul deschis și neterminat.
              const primary =
                !state.locked &&
                !state.done &&
                TABS.every(
                  (o) =>
                    o.step >= t.step || steps[o.id].done || steps[o.id].locked,
                );
              return (
                <button
                  key={t.id}
                  onClick={() =>
                    state.locked ? setStepHint(state.reason) : openTab(t.id)
                  }
                  aria-label={
                    state.locked
                      ? `Pasul ${t.step}, ${t.label} — încă închis`
                      : undefined
                  }
                  style={
                    primary
                      ? { background: t.color, borderColor: t.color }
                      : undefined
                  }
                  className={`relative rounded-xl border px-2.5 py-2.5 pr-7 text-left ${
                    primary
                      ? "text-ink"
                      : state.locked
                        ? "border-ink-line/60 text-paper-faint"
                        : state.done
                          ? "border-[color:var(--ok)]/50 bg-[color:var(--ok)]/10 text-paper"
                          : "border-ink-line text-paper-dim"
                  }`}
                >
                  <span
                    className={`flex items-center gap-1 text-[10px] ${primary ? "text-ink/60" : "text-paper-faint"}`}
                  >
                    {state.locked && (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        className="h-3 w-3 shrink-0"
                      >
                        <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
                        <path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" />
                      </svg>
                    )}
                    Pasul {t.step}
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] font-medium">
                    {t.label}
                    {state.done ? (
                      <span className="absolute top-1.5 right-1.5 text-[12px] text-[color:var(--ok)]">
                        ✓
                      </span>
                    ) : (
                      badge > 0 &&
                      !state.locked && (
                        <span
                          className={`absolute top-1.5 right-1.5 rounded-full px-1.5 text-[10px] ${
                            primary
                              ? "bg-ink/10"
                              : "bg-[color:var(--todo)]/15 text-[color:var(--todo)]"
                          }`}
                        >
                          {badge}
                        </span>
                      )
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        {!chatOpen && sheetOpen && (
          <div className="fixed inset-0 z-30 flex flex-col justify-end bg-ink/60 sm:hidden">
            <button
              aria-label="Închide"
              onClick={() => setSheetOpen(false)}
              className="flex-1"
            />
            <div className="flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-ink-line bg-ink-soft pb-[env(safe-area-inset-bottom)]">
              <div className="flex justify-center py-2">
                <span className="h-1 w-10 rounded-full bg-ink-line" />
              </div>
              <div className="min-h-0 flex-1">
                {workspace(() => setSheetOpen(false))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ecran mare: coloana din dreapta, cu un singur conținut la un moment dat. */}
      <aside className="hidden h-full w-[400px] shrink-0 flex-col border-l border-ink-line bg-ink-soft/70 sm:flex lg:w-[440px]">
        {selectedId ? (
          <NodeDetail
            key={selectedId}
            nodeId={selectedId}
            onClose={() => openNode(null)}
            onChanged={reload}
          />
        ) : chatOpen ? (
          <ChatPanel
            messages={messages}
            pending={pending}
            extracting={extracting}
            limit={limit}
            onSend={send}
            onClose={closeChat}
            title={chatTitle}
            done={lessonDone}
            onContinue={() => setLessonDone(null)}
          />
        ) : (
          workspace()
        )}
      </aside>

      {/* Telefon: conversația și nodul deschis sunt foi peste hartă. */}
      <div className="sm:hidden">
        {chatOpen && !selectedId && (
          <ChatPanel
            messages={messages}
            pending={pending}
            extracting={extracting}
            limit={limit}
            onSend={send}
            onClose={closeChat}
            title={chatTitle}
            done={lessonDone}
            onContinue={() => setLessonDone(null)}
          />
        )}
        {selectedId && (
          <NodeDetail
            key={selectedId}
            nodeId={selectedId}
            onClose={() => openNode(null)}
            onChanged={reload}
          />
        )}
      </div>
    </div>
  );
}
