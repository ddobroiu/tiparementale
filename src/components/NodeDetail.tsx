"use client";

import { useEffect, useState } from "react";

import type {
  MindNode,
  Observation,
  Recommendation,
  RecommendationKind,
  Transformation,
} from "@/lib/types";
import {
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  NODE_TYPE_LABELS,
  changeDegree,
  displayLabel,
} from "@/lib/types";

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
  transformations: Transformation[];
}

const KIND_LABELS: Record<RecommendationKind, string> = {
  exercise: "Exercițiu",
  example: "Exemplu concret",
  book: "Carte",
  film: "Film",
};

const KIND_ORDER: RecommendationKind[] = ["exercise", "example", "book", "film"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long" });
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
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const [whyOld, setWhyOld] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Montat cu `key={nodeId}`, deci starea pornește curată la fiecare nod.
  useEffect(() => {
    fetch(`/api/nodes/${nodeId}`)
      .then((r) => r.json())
      .then((payload: Payload) => {
        setData(payload);
        setDraft(displayLabel(payload.node));
      })
      .catch(() => setData(null));
  }, [nodeId]);

  async function reload() {
    const payload = await fetch(`/api/nodes/${nodeId}`).then((r) => r.json());
    setData(payload);
    onChanged();
  }

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch(`/api/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await reload();
    } catch {
      setError("Nu am putut salva. Verifică legătura și încearcă din nou.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Pornește lucrul: convingere nouă, exerciții, exemple, carte, film.
   *
   * `finally` nu este decorativ: fără el, orice eroare de rețea lăsa butonul
   * blocat pe „Pregătesc…" la nesfârșit, fără ca omul să afle că a eșuat.
   */
  async function startTransformation() {
    setWorking(true);
    setError("");

    try {
      const res = await fetch(`/api/nodes/${nodeId}/transform`, { method: "POST" });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(payload.error ?? "Nu a mers. Încearcă din nou.");
        return;
      }

      setWhyOld(payload.whyOldPersists ?? null);
      await reload();
    } catch {
      setError("Nu am putut ajunge la server. Încearcă din nou.");
    } finally {
      setWorking(false);
    }
  }

  async function setTransformationStatus(id: string, status: string) {
    setBusy(true);
    try {
      await fetch(`/api/transformations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await reload();
    } catch {
      setError("Nu am putut salva. Încearcă din nou.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <aside className="fixed inset-0 z-30 border-l border-ink-line bg-ink-soft/95 p-6 backdrop-blur-md sm:static sm:z-auto sm:w-[400px] sm:shrink-0 sm:bg-ink-soft/60">
        <p className="text-sm text-paper-faint">Se încarcă…</p>
      </aside>
    );
  }

  const { node, observations, history, recommendations, transformations } = data;
  const confirmed = node.verdict === "confirmed" || node.verdict === "edited";
  const change = changeDegree(node);
  const active = transformations.find((t) => t.status !== "dismissed");
  const forActive = active
    ? recommendations.filter((r) => r.transformation_id === active.id)
    : [];

  return (
    <aside className="animate-fade-up fixed inset-0 z-30 overflow-y-auto border-l border-ink-line bg-ink-soft/95 backdrop-blur-md sm:static sm:z-auto sm:w-[400px] sm:shrink-0 sm:bg-ink-soft/70">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: DOMAIN_COLORS[node.domain] }}
            />
            <span className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              {DOMAIN_LABELS[node.domain]} · {NODE_TYPE_LABELS[node.type]}
            </span>
          </div>
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
                disabled={busy}
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

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-paper-faint">
          <span>Încredere {Math.round(node.confidence * 100)}%</span>
          <span>·</span>
          <span>
            {observations.length} {observations.length === 1 ? "mențiune" : "mențiuni"}
          </span>
          {change.weakened && (
            <>
              <span>·</span>
              <span className="text-[color:var(--value)]">
                ↓ {change.points} puncte față de vârf
              </span>
            </>
          )}
        </div>

        {/* Bucla de precizie: ce confirmi devine adevăr, ce respingi nu revine. */}
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
                    disabled={busy}
                    onClick={() => patch({ verdict: "confirmed" })}
                    className="rounded-full bg-paper px-4 py-1.5 text-xs font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    Da, e adevărat
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setEditing(true)}
                    className="rounded-full border border-ink-line px-4 py-1.5 text-xs text-paper-dim transition-colors hover:border-paper-faint hover:text-paper"
                  >
                    Aproape — reformulez
                  </button>
                  <button
                    disabled={busy}
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

        {/* Transformarea. Doar pentru ce a confirmat: nu lucrăm pe ipoteze. */}
        {confirmed && !active && (
          <section className="mt-6">
            <h3 className="font-serif text-lg">Vrei să lucrăm la asta?</h3>
            <p className="mt-2 text-sm leading-relaxed text-paper-dim">
              Îți propun o convingere nouă care să-i ia locul, cu exerciții mici
              și exemple concrete prin care s-o exersezi.
            </p>
            <button
              onClick={startTransformation}
              disabled={working}
              className="mt-4 w-full rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {working ? "Pregătesc…" : "Lucrăm la asta"}
            </button>
            {working && (
              <p className="mt-2 text-center text-xs text-paper-faint">
                Durează până la un minut. Merită așteptarea.
              </p>
            )}
            {error && <p className="mt-3 text-xs text-[color:var(--emotion)]">{error}</p>}
          </section>
        )}

        {active && (
          <section className="mt-6">
            <h3 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
              Convingerea nouă
            </h3>
            <p className="mt-2 font-serif text-xl leading-snug text-[color:var(--value)]">
              {active.new_label}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-paper-dim">{active.rationale}</p>

            {whyOld && (
              <p className="mt-3 border-l border-ink-line pl-3 text-sm leading-relaxed text-paper-faint">
                {whyOld}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {active.status !== "practicing" && active.status !== "adopted" && (
                <button
                  disabled={busy}
                  onClick={() => setTransformationStatus(active.id, "practicing")}
                  className="rounded-full bg-paper px-4 py-1.5 text-xs font-medium text-ink disabled:opacity-50"
                >
                  O exersez
                </button>
              )}
              {active.status === "practicing" && (
                <button
                  disabled={busy}
                  onClick={() => setTransformationStatus(active.id, "adopted")}
                  className="rounded-full bg-paper px-4 py-1.5 text-xs font-medium text-ink disabled:opacity-50"
                >
                  Am adoptat-o
                </button>
              )}
              {active.status === "adopted" && (
                <span className="rounded-full border border-ink-line px-4 py-1.5 text-xs text-[color:var(--value)]">
                  ✓ Adoptată
                </span>
              )}
              <button
                disabled={busy}
                onClick={() => setTransformationStatus(active.id, "dismissed")}
                className="rounded-full border border-ink-line px-4 py-1.5 text-xs text-paper-faint hover:text-paper-dim"
              >
                Nu mi se potrivește
              </button>
            </div>

            {KIND_ORDER.map((kind) => {
              const items = forActive.filter((r) => r.kind === kind);
              if (items.length === 0) return null;

              return (
                <div key={kind} className="mt-5">
                  <h4 className="text-[11px] tracking-[0.16em] text-paper-faint uppercase">
                    {KIND_LABELS[kind]}
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {items.map((item) => (
                      <li key={item.id} className="rounded-lg border border-ink-line p-3">
                        <p className="text-sm text-paper">
                          {item.title}
                          {item.creator && (
                            <span className="text-paper-dim">, {item.creator}</span>
                          )}
                          {item.year && (
                            <span className="text-paper-faint"> ({item.year})</span>
                          )}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-paper-dim">
                          {item.rationale}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
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
      </div>
    </aside>
  );
}
