"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Golește harta contului, din admin. Contul și portofelul rămân. */
export function ResetMapButton({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function reset() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/users/${userId}/reset`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Nu a mers.");
      setBusy(false);
      return;
    }
    setDone(`Hartă golită: ${data.nodes} noduri, ${data.conversations} conversații.`);
    setOpen(false);
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      {done && <p className="mb-2 text-xs text-[color:var(--value)]">{done}</p>}
      {open ? (
        <div className="rounded-2xl border border-ink-line p-4">
          <p className="text-sm text-paper">Golești harta pentru {email}.</p>
          <p className="mt-1 text-xs leading-relaxed text-paper-faint">
            Nodurile, conversațiile, predicțiile și citirile dispar. Contul, ședințele și
            plățile rămân.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              disabled={busy}
              onClick={reset}
              className="rounded-xl bg-paper px-4 py-2 text-sm font-medium text-ink disabled:opacity-40"
            >
              {busy ? "Resetez…" : "Resetează harta"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl border border-ink-line px-4 py-2 text-sm text-paper-dim"
            >
              Renunță
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-[color:var(--emotion)]">{error}</p>}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-paper-faint underline underline-offset-4 hover:text-paper-dim"
        >
          Resetează harta acestui cont
        </button>
      )}
    </div>
  );
}
