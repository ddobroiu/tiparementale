"use client";

import { useEffect } from "react";

import { gaEnabled } from "@/lib/ga";
import { CONSENT_EVENT } from "@/lib/meta/consent";

/**
 * Evenimentul GA4 `purchase` la întoarcerea de la Stripe.
 *
 * Doar GA: la Meta, cumpărarea pleacă din webhook (Conversions API), deci nu o
 * dublăm din browser. Se trimite numai cu acord analitic (gtag există doar
 * atunci) și o singură dată pe tranzacție, chiar dacă pagina se reîncarcă.
 * Fără date personale: doar id-ul intern al cumpărării, valoarea și pachetul.
 */
export function GaPurchase({
  transactionId,
  value,
  pack,
}: {
  transactionId: string;
  value: number;
  pack: string;
}) {
  useEffect(() => {
    const key = `tm_ga_purchase_${transactionId}`;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function alreadySent(): boolean {
      try {
        return localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    }

    function send() {
      if (alreadySent()) return;
      // gtag.js se încarcă în MetaPixel la același eveniment de acord; un tick
      // de așteptare îi lasă loc.
      timer = setTimeout(() => {
        if (alreadySent() || !gaEnabled() || typeof window.gtag !== "function") return;
        window.gtag("event", "purchase", {
          transaction_id: transactionId,
          value,
          currency: "RON",
          items: [{ item_id: pack, item_name: pack, price: value, quantity: 1 }],
        });
        try {
          localStorage.setItem(key, "1");
        } catch {
          // fără stocare: rămâne doar protecția pe durata paginii
        }
      }, 0);
    }

    send();
    window.addEventListener(CONSENT_EVENT, send);
    return () => {
      window.removeEventListener(CONSENT_EVENT, send);
      if (timer) clearTimeout(timer);
    };
  }, [transactionId, value, pack]);

  return null;
}
