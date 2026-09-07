"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Cumpărarea unui pachet.
 *
 * Cine nu are cont e trimis să-și facă unul, cu pachetul reținut în adresă:
 * după autentificare ajunge înapoi aici, nu într-un loc din care trebuie să
 * reia tot drumul.
 */
export function BuyButton({
  pack,
  highlighted,
  loggedIn,
}: {
  pack: string;
  highlighted: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    if (!loggedIn) {
      router.push(`/intra?redirect=${encodeURIComponent("/pachete")}`);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error ?? "Nu am putut porni plata. Încearcă din nou.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Nu am putut ajunge la server. Încearcă din nou.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={buy}
        disabled={busy}
        className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 ${
          highlighted
            ? "bg-paper text-ink"
            : "border border-ink-line text-paper hover:border-paper-faint"
        }`}
      >
        {busy ? "Un moment…" : loggedIn ? "Cumpără" : "Fă-ți cont și cumpără"}
      </button>
      {error && <p className="mt-2 text-xs text-[color:var(--emotion)]">{error}</p>}
    </>
  );
}
