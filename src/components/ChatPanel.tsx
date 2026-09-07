"use client";

import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  messages: ChatMessage[];
  pending: boolean;
  /** Extracția rulează: harta se actualizează chiar acum. */
  extracting: boolean;
  /** Ședința s-a terminat sau planul s-a epuizat: nu se mai poate scrie. */
  limit: { reason: string; code: string } | null;
  onSend: (text: string) => void;
  onClose: () => void;
}

/**
 * Conversația este metoda, nu destinația.
 *
 * Panoul stă *lângă* hartă, nu peste ea: harta creștea exact sub el și nu se
 * vedea. Pe ecran îngust nu există loc pentru două coloane, deci acolo devine
 * o foaie de jos, iar harta rămâne vizibilă deasupra.
 */
export function ChatPanel({ messages, pending, extracting, limit, onSend, onClose }: Props) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setDraft("");
    onSend(text);
  }

  return (
    <aside className="animate-fade-up fixed inset-x-0 bottom-0 z-20 flex h-[52vh] flex-col border-t border-ink-line bg-ink-soft/95 backdrop-blur-md sm:static sm:h-auto sm:w-[380px] sm:shrink-0 sm:border-t-0 sm:border-l lg:w-[420px]">
      <div className="flex items-center justify-between border-b border-ink-line px-5 py-3">
        <span className="text-xs tracking-[0.16em] text-paper-faint uppercase">
          Spune ce ai pe suflet
        </span>
        <button
          onClick={onClose}
          className="text-xs text-paper-faint transition-colors hover:text-paper"
        >
          Închide
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="text-sm leading-relaxed text-paper-faint">
            Nu trebuie să fie ordonat sau important. Scrie cum îți vine.
          </p>
        )}
        {messages.map((message, i) => (
          <p
            key={i}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-sm leading-relaxed text-paper"
                : "max-w-[90%] font-serif text-[15px] leading-relaxed text-paper-dim"
            }
          >
            {message.content}
          </p>
        ))}
        {pending && <p className="text-sm text-paper-faint">…</p>}
      </div>

      {/* Harta se schimbă în salturi, nu după fiecare propoziție. Când se
          întâmplă, omul trebuie să știe unde să se uite. */}
      {extracting && (
        <p className="border-t border-ink-line px-5 py-2 text-xs text-paper-faint">
          <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--belief)]" />
          Actualizez harta…
        </p>
      )}

      {limit ? (
        <div className="border-t border-ink-line p-4">
          <p className="text-sm leading-relaxed text-paper-dim">{limit.reason}</p>
          <button
            onClick={onClose}
            className="mt-3 w-full rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Vezi ce s-a schimbat în hartă
          </button>
          {limit.code === "no_sessions" && (
            <a
              href="/pachete"
              className="mt-2 block rounded-xl border border-ink-line px-4 py-2.5 text-center text-sm text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
            >
              Vezi pachetele
            </a>
          )}
        </div>
      ) : (
      <form onSubmit={submit} className="flex gap-2 border-t border-ink-line p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Scrie aici…"
          autoFocus
          className="min-w-0 flex-1 rounded-xl bg-ink px-4 py-2.5 text-sm text-paper outline-none placeholder:text-paper-faint"
        />
        <button
          type="submit"
          disabled={pending || draft.trim().length === 0}
          className="shrink-0 rounded-xl bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Trimite
        </button>
      </form>
      )}
    </aside>
  );
}
