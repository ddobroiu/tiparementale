"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { track } from "@/lib/meta/pixel";

/**
 * Cumpărarea unui pachet.
 *
 * Cine nu are cont e trimis să-și facă unul, cu pachetul reținut în adresă:
 * după autentificare ajunge înapoi aici, nu într-un loc din care trebuie să
 * reia tot drumul.
 */
export function BuyButton({
  pack,
  priceRon,
  highlighted,
  loggedIn,
  color,
}: {
  pack: string;
  priceRon: number;
  highlighted: boolean;
  loggedIn: boolean;
  /** Culoarea pachetului: plin la cel recomandat, doar contur la celelalte. */
  color: string;
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

    // Același ID pleacă din browser și, prin server, către Meta: un singur
    // eveniment InitiateCheckout, nu două.
    const eventId = track("InitiateCheckout", {
      content_ids: [pack],
      content_type: "product",
      value: priceRon,
      currency: "RON",
    });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack, eventId }),
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
        style={highlighted ? { background: color } : { borderColor: color, color }}
        className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 ${
          highlighted ? "text-ink" : "border"
        }`}
      >
        {busy ? "Un moment…" : loggedIn ? "Cumpără" : "Fă-ți cont și cumpără"}
      </button>
      {error && <p className="mt-2 text-xs text-[color:var(--emotion)]">{error}</p>}
    </>
  );
}
