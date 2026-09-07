"use client";

import { useEffect, useState } from "react";

import type { MindNode, Observation, Recommendation } from "@/lib/types";
import { NODE_TYPE_LABELS, displayLabel } from "@/lib/types";

interface HistoryEntry {
  id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

interface Payload {
  node: MindNode;
  observations: Observation[];
  history: HistoryEntry[];
  recommendations: Recommendation[];
}

const KIND_LABELS = { exercise: "Exercițiu", book: "Carte", film: "Film" } as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
  });
}

export function NodeDetail({
  nodeId,
  onClose,
  onChanged,
}: {
  nodeId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  // Componenta este montată cu `key={nodeId}`, deci starea pornește curată la
  // fiecare nod: efectul doar aduce datele.
  useEffect(() => {
    fetch(`/api/nodes/${nodeId}`)
      .then((r) => r.json())
      .then((payload: Payload) => {
        setData(payload);
        setDraft(displayLabel(payload.node));
      })
      .catch(() => setData(null));
  }, [nodeId]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/nodes/${nodeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    onChanged();
  }

  if (!data) {
    return (
      <aside className="w-full border-l border-ink-line bg-ink-soft/60 p-6 backdrop-blur-md sm:w-[380px]">
        <p className="text-sm text-paper-faint">Se încarcă…</p>
      </aside>
    );
  }

  const { node, observations, history, recommendations } = data;
  const confirmed = node.verdict === "confirmed" || node.verdict === "edited";

  return (
    <aside className="animate-fade-up w-full overflow-y-auto border-l border-ink-line bg-ink-soft/70 backdrop-blur-md sm:w-[380px]">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
            {NODE_TYPE_LABELS[node.type]}
          </span>
          <button
            onClick={onClose}
            className="text-paper-faint transition-colors hover:text-paper"
            aria-label="Închide"
          >
            ✕
          </button>
        </div>

        {editing ? (
          <div className="mt-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-ink-line bg-ink px-3 py-2 font-serif text-lg text-paper outline-none focus:border-paper-faint"
            />
            <div className="mt-2 flex gap-2">
              <button
                disabled={saving}
                onClick={async () => {
                  await patch({ user_label: draft });
                  setEditing(false);
                }}
                className="rounded-full bg-paper px-4 py-1.5 text-xs font-medium text-ink disabled:opacity-50"
              >
                Salvează formularea mea
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-full border border-ink-line px-4 py-1.5 text-xs text-paper-dim"
              >
                Renunță
              </button>
            </div>
          </div>
        ) : (
          <h2 className="mt-3 font-serif text-2xl leading-snug">{displayLabel(node)}</h2>
        )}

        {node.summary && !editing && (
          <p className="mt-3 text-sm leading-relaxed text-paper-dim">{node.summary}</p>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs text-paper-faint">
          <span>Încredere {Math.round(node.confidence * 100)}%</span>
          <span>·</span>
          <span>
            {observations.length}{" "}
            {observations.length === 1 ? "mențiune" : "mențiuni"}
          </span>
        </div>

        {/* Bucla de precizie. Ce confirmi devine adevăr; ce respingi nu revine. */}
        {!editing && (
          <div className="mt-5 border-y border-ink-line py-5">
            {confirmed ? (
              <p className="text-sm text-[color:var(--value)]">
                ✓ Confirmat de tine
                <button
                  onClick={() => patch({ verdict: "unconfirmed" })}
                  className="ml-3 text-paper-faint underline underline-offset-2 hover:text-paper-dim"
                >
                  retrage
                </button>
              </p>
            ) : (
              <>
                <p className="text-sm text-paper-dim">Te regăsești în asta?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    disabled={saving}
                    onClick={() => patch({ verdict: "confirmed" })}
                    className="rounded-full bg-paper px-4 py-1.5 text-xs font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    Da, e adevărat
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => setEditing(true)}
                    className="rounded-full border border-ink-line px-4 py-1.5 text-xs text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
                  >
                    Aproape — reformulez
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => patch({ verdict: "rejected" })}
                    className="rounded-full border border-ink-line px-4 py-1.5 text-xs text-paper-faint transition-colors hover:border-paper-faint hover:text-paper-dim"
                  >
                    Nu e asta
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Răspunsul la „de unde știi asta despre mine?” */}
        <section className="mt-6">
          <h3 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
            Din ce am dedus
          </h3>
          <ul className="mt-3 space-y-3">
            {observations.map((obs) => (
              <li key={obs.id} className="border-l border-ink-line pl-3">
                <p className="font-serif text-sm leading-relaxed text-paper-dim">
                  „{obs.quote}”
                </p>
                <p className="mt-1 text-[11px] text-paper-faint">
                  {formatDate(obs.observed_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {history.length > 0 && (
          <section className="mt-6">
            <h3 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              Cum s-a schimbat
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-paper-faint">
              {history.map((entry) => (
                <li key={entry.id}>
                  {formatDate(entry.changed_at)} · {entry.field}: {entry.old_value} →{" "}
                  {entry.new_value}
                </li>
              ))}
            </ul>
          </section>
        )}

        {recommendations.length > 0 && (
          <section className="mt-6">
            <h3 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              Pentru acest tipar
            </h3>
            <ul className="mt-3 space-y-3">
              {recommendations.map((rec) => (
                <li key={rec.id} className="rounded-lg border border-ink-line p-3">
                  <p className="text-[10px] tracking-[0.14em] text-paper-faint uppercase">
                    {KIND_LABELS[rec.kind]}
                  </p>
                  <p className="mt-1 text-sm text-paper">
                    {rec.title}
                    {rec.creator && (
                      <span className="text-paper-dim">, {rec.creator}</span>
                    )}
                    {rec.year && <span className="text-paper-faint"> ({rec.year})</span>}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-paper-dim">
                    {rec.rationale}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}
