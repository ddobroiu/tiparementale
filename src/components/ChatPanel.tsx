"use client";

import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  open: boolean;
  messages: ChatMessage[];
  pending: boolean;
  onSend: (text: string) => void;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * Conversația este metoda, nu destinația: panoul stă peste hartă și se închide
 * înapoi în ea. Nu există ecran în care chatul să fie locul unde rămâi.
 */
export function ChatPanel({ open, messages, pending, onSend, onOpen, onClose }: Props) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  if (!open) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-6">
        <button
          onClick={onOpen}
          className="pointer-events-auto rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink shadow-lg transition-opacity hover:opacity-90"
        >
          Vorbește liber
        </button>
      </div>
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setDraft("");
    onSend(text);
  }

  return (
    <div className="animate-fade-up absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6">
      <div className="flex max-h-[60vh] w-full max-w-2xl flex-col rounded-2xl border border-ink-line bg-ink-soft/95 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-ink-line px-5 py-3">
          <span className="text-xs tracking-[0.16em] text-paper-faint uppercase">
            Spune ce ai pe suflet
          </span>
          <button
            onClick={onClose}
            className="text-xs text-paper-faint transition-colors hover:text-paper"
          >
            Înapoi la hartă
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
                  : "max-w-[85%] font-serif text-[15px] leading-relaxed text-paper-dim"
              }
            >
              {message.content}
            </p>
          ))}
          {pending && <p className="text-sm text-paper-faint">…</p>}
        </div>

        <form onSubmit={submit} className="flex gap-2 border-t border-ink-line p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Scrie aici…"
            autoFocus
            className="flex-1 rounded-xl bg-ink px-4 py-2.5 text-sm text-paper outline-none placeholder:text-paper-faint"
          />
          <button
            type="submit"
            disabled={pending || draft.trim().length === 0}
            className="rounded-xl bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Trimite
          </button>
        </form>
      </div>
    </div>
  );
}
