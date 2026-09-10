"use client";

import { useEffect, useRef, useState } from "react";

import { useVisualViewport } from "@/lib/use-visual-viewport";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** Variante de răspuns rapid, pe modelul chestionarului Young. Opționale. */
  options?: string[] | null;
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
  /** Lecția în curs, sau nimic pentru conversația liberă. */
  title?: string | null;
  /** Lecția s-a încheiat: ce s-a schimbat pe hartă, și ce poate face omul. */
  done?: { created: number; strengthened: number } | null;
  /** Continuă conversația după încheiere, în aceeași ședință. */
  onContinue?: () => void;
}

/**
 * Conversația este metoda, nu destinația.
 *
 * Panoul stă *lângă* hartă, nu peste ea: harta creștea exact sub el și nu se
 * vedea. Pe ecran îngust nu există loc pentru două coloane, deci acolo devine
 * o foaie de jos, iar harta rămâne vizibilă deasupra.
 */
export function ChatPanel({
  messages,
  pending,
  extracting,
  limit,
  onSend,
  onClose,
  title = null,
  done = null,
  onContinue,
}: Props) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewport = useVisualViewport();
  const keyboard = viewport?.keyboardOpen ?? false;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending, keyboard]);

  // Pe telefon, cu tastatura deschisă, foaia ia exact fereastra rămasă
  // vizibilă: câmpul de scris stă deasupra tastaturii, nu sub ea. Harta e
  // oricum acoperită de tastatură în acel moment.
  const sheetStyle =
    viewport && keyboard
      ? { top: viewport.offsetTop, height: viewport.height, bottom: "auto" }
      : undefined;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setDraft("");
    onSend(text);
  }

  return (
    <aside
      style={sheetStyle}
      className="animate-fade-up fixed inset-x-0 bottom-0 z-20 flex h-[56dvh] flex-col border-t border-ink-line bg-ink-soft/95 backdrop-blur-md sm:static sm:h-full sm:w-full sm:border-t-0 sm:bg-transparent sm:backdrop-blur-none"
    >
      <div className="flex items-center justify-between border-b border-ink-line px-5 py-3">
        <span className="min-w-0 truncate text-xs tracking-[0.16em] text-paper-faint uppercase">
          {title ?? "Conversație liberă"}
        </span>
        <button
          onClick={onClose}
          className="text-xs text-paper-faint transition-colors hover:text-paper"
        >
          Închide
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
      >
        {messages.length === 0 && (
          <p className="text-sm leading-relaxed text-paper-faint">
            Nu trebuie să fie ordonat sau important. Scrie cum îți vine.
          </p>
        )}
        {messages.map((message, i) => {
          const isLast = i === messages.length - 1;
          const showOptions =
            message.role === "assistant" &&
            isLast &&
            !pending &&
            !limit &&
            (message.options?.length ?? 0) > 0;

          return (
            <div key={i}>
              <p
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-sm leading-relaxed text-paper"
                    : "max-w-[90%] font-serif text-[15px] leading-relaxed text-paper-dim"
                }
              >
                {message.content}
              </p>

              {/* Variantele stau doar sub ultima întrebare: la cele vechi ar fi
                  zgomot, iar răspunsul a fost dat oricum. Scrisul liber rămâne
                  mereu posibil — variantele scurtează drumul, nu îl închid. */}
              {showOptions && (
                <div className="animate-fade-up mt-3 flex flex-wrap gap-2">
                  {message.options!.map((option) => (
                    <button
                      key={option}
                      onClick={() => onSend(option)}
                      className="rounded-full border border-ink-line px-3.5 py-1.5 text-sm text-paper-dim transition-colors hover:border-[color:var(--belief)] hover:text-paper"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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

      {done && !limit ? (
        <div className="border-t border-[color:var(--value)]/40 bg-[color:var(--value)]/5 p-4">
          <p className="text-[11px] tracking-[0.16em] text-[color:var(--value)] uppercase">
            Lecția s-a încheiat
          </p>
          <p className="mt-2 text-sm leading-relaxed text-paper">
            {done.created + done.strengthened === 0
              ? "Harta e la zi cu ce ai povestit."
              : `Pe hartă ${done.created > 0 ? `au apărut ${done.created} ${done.created === 1 ? "element nou" : "elemente noi"}` : ""}${done.created > 0 && done.strengthened > 0 ? " și " : ""}${done.strengthened > 0 ? `s-au întărit ${done.strengthened}` : ""}.`}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-paper-faint">
            Pasul următor: deschide elementele și spune dacă am nimerit. Ce
            confirmi poate fi lucrat.
          </p>
          <button
            onClick={onClose}
            className="mt-3 w-full rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Vezi harta și confirmă
          </button>
          {onContinue && (
            <button
              onClick={onContinue}
              className="mt-2 w-full rounded-xl px-4 py-2 text-sm text-paper-faint transition-colors hover:text-paper-dim"
            >
              Mai am ceva de spus — continui în aceeași ședință
            </button>
          )}
        </div>
      ) : limit ? (
        <div className="border-t border-ink-line p-4">
          <p className="text-sm leading-relaxed text-paper-dim">
            {limit.reason}
          </p>

          {/* Când omul a rămas fără ședințe, acțiunea principală este să
              cumpere, nu să se întoarcă în hartă. Butonul plin merge acolo
              unde vrem să meargă și el. */}
          {limit.code === "no_sessions" ? (
            <>
              <a
                href="/pachete"
                className="mt-3 block rounded-xl bg-paper px-4 py-3 text-center text-sm font-semibold text-ink shadow-lg transition-opacity hover:opacity-90"
              >
                Cumpără ședințe
              </a>
              <button
                onClick={onClose}
                className="mt-2 w-full rounded-xl px-4 py-2 text-sm text-paper-faint transition-colors hover:text-paper-dim"
              >
                Mai târziu — înapoi la hartă
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="mt-3 w-full rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
            >
              Vezi ce s-a schimbat în hartă
            </button>
          )}
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="flex gap-2 border-t border-ink-line p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Scrie aici…"
            autoFocus
            enterKeyHint="send"
            className="min-w-0 flex-1 rounded-xl bg-ink px-4 py-2.5 text-base text-paper outline-none placeholder:text-paper-faint sm:text-sm"
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
