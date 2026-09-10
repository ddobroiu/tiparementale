"use client";

import { useState } from "react";

import { SCHEMAS, SCHEMA_DOMAIN_LABELS } from "@/lib/schemas";
import {
  DOMAIN_LABELS,
  EXPLORABLE_DOMAINS,
  NODE_TYPE_LABELS,
  type LifeDomain,
  type NodeType,
} from "@/lib/types";

/**
 * „Știu deja asta despre mine."
 *
 * Nu tot ce știe cineva trebuie să iasă dintr-o conversație. Cine își cunoaște
 * o frică sau un tipar îl poate pune direct pe hartă, în cuvintele lui. Intră
 * ca confirmat — el l-a spus — și, opțional, în familia de tipare potrivită.
 */
const TYPE_ORDER: NodeType[] = ["belief", "fear", "pattern", "emotion", "value", "goal", "relationship"];

export function AddNodeForm({ onAdded }: { onAdded: (nodeId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<NodeType>("belief");
  const [domain, setDomain] = useState<LifeDomain>("self");
  const [schemaCode, setSchemaCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          type,
          domain,
          schema_code: schemaCode || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Nu a mers. Încearcă din nou.");
        return;
      }
      setLabel("");
      setSchemaCode("");
      setOpen(false);
      onAdded(data.node.id);
    } catch {
      setError("Nu am putut ajunge la server.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-ink-line bg-ink-soft/80 px-3.5 py-1.5 text-xs text-paper-dim backdrop-blur-md transition-colors hover:border-paper-faint hover:text-paper"
      >
        + Știu deja ceva
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="animate-fade-up w-[min(92vw,26rem)] rounded-2xl border border-ink-line bg-ink-soft/95 p-5 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-[10px] tracking-[0.16em] text-paper-faint uppercase">
          Adaugă pe hartă
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-paper-faint hover:text-paper"
          aria-label="Închide"
        >
          ✕
        </button>
      </div>

      <label className="mt-4 block text-xs text-paper-faint">
        În cuvintele tale, la persoana întâi
        <textarea
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          rows={2}
          required
          minLength={3}
          maxLength={200}
          placeholder="„Dacă cer ajutor, înseamnă că nu mă descurc”"
          className="mt-1 w-full resize-none rounded-lg border border-ink-line bg-ink px-3 py-2 font-serif text-[15px] text-paper outline-none placeholder:text-paper-faint focus:border-paper-faint"
        />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block text-xs text-paper-faint">
          Ce este
          <select
            value={type}
            onChange={(e) => setType(e.target.value as NodeType)}
            className="mt-1 w-full rounded-lg border border-ink-line bg-ink px-2 py-2 text-xs text-paper outline-none"
          >
            {TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {NODE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-paper-faint">
          Zona
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as LifeDomain)}
            className="mt-1 w-full rounded-lg border border-ink-line bg-ink px-2 py-2 text-xs text-paper outline-none"
          >
            {EXPLORABLE_DOMAINS.map((d) => (
              <option key={d} value={d}>
                {DOMAIN_LABELS[d]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block text-xs text-paper-faint">
        Familia tiparului <span className="text-paper-faint/70">(opțional)</span>
        <select
          value={schemaCode}
          onChange={(e) => setSchemaCode(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ink-line bg-ink px-2 py-2 text-xs text-paper outline-none"
        >
          <option value="">Nu știu / nu se potrivește</option>
          {SCHEMAS.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name} — {SCHEMA_DOMAIN_LABELS[s.domain]}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={busy || label.trim().length < 3}
        className="mt-4 w-full rounded-xl bg-paper px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Adaug…" : "Pune pe hartă"}
      </button>

      <p className="mt-2 text-[11px] leading-relaxed text-paper-faint">
        Intră ca confirmat, cu formularea ta drept sursă. Poți să-l reformulezi
        sau să-l respingi oricând.
      </p>

      {error && <p className="mt-2 text-xs text-[color:var(--emotion)]">{error}</p>}
    </form>
  );
}
