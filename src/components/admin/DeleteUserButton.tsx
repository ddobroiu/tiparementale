"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Ștergerea unui cont: ireversibilă, deci cere să scrii adresa. Un buton
 * roșu cu „sigur?” se apasă din reflex; o adresă tastată, nu.
 */
export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Nu a mers.");
      setBusy(false);
      return;
    }
    router.push("/admin/utilizatori");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-paper-faint underline underline-offset-4 hover:text-[color:var(--emotion)]"
      >
        Șterge acest cont
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--emotion)]/40 p-4">
      <p className="text-sm text-paper">Ștergi tot ce ține de acest cont.</p>
      <p className="mt-1 text-xs leading-relaxed text-paper-faint">
        Harta, conversațiile, portofelul și istoricul plăților dispar definitiv. Scrie adresa
        ca să confirmi.
      </p>
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={email}
        autoComplete="off"
        className="mt-3 w-full rounded-xl border border-ink-line bg-ink-soft px-3 py-2 text-sm text-paper outline-none placeholder:text-paper-faint focus:border-paper-faint"
      />
      <div className="mt-3 flex gap-2">
        <button
          disabled={busy || typed.trim().toLowerCase() !== email.toLowerCase()}
          onClick={remove}
          className="rounded-xl bg-[color:var(--emotion)] px-4 py-2 text-sm font-medium text-ink disabled:opacity-40"
        >
          {busy ? "Șterg…" : "Șterge definitiv"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          className="rounded-xl border border-ink-line px-4 py-2 text-sm text-paper-dim"
        >
          Renunță
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-[color:var(--emotion)]">{error}</p>}
    </div>
  );
}
