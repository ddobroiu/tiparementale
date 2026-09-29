"use client";

import { useEffect } from "react";

import { CONSENT_EVENT, hasConsent } from "@/lib/meta/consent";
import { loadTikTok, trackTikTok } from "@/lib/tiktok";

/**
 * Evenimentul TikTok `CompletePayment` la întoarcerea de la Stripe (/harta).
 *
 * Doar cu acord de marketing, o singură dată pe cumpărare (cheie separată de
 * cea GA4), chiar dacă acordul vine după afișarea paginii. /harta e exclusă
 * pentru pixel, deci aici se încarcă explicit, doar pentru acest eveniment
 * (fără page()). Fără date personale: id-ul intern al cumpărării, valoarea,
 * pachetul.
 */
export function TikTokPurchase({
  transactionId,
  value,
  pack,
}: {
  transactionId: string;
  value: number;
  pack: string;
}) {
  useEffect(() => {
    const key = `tt_purchase_${transactionId}`;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function alreadySent(): boolean {
      try {
        return localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    }

    function send() {
      if (alreadySent() || !hasConsent("marketing")) return;
      if (!loadTikTok({ allowExcluded: true })) return;
      timer = setTimeout(() => {
        if (alreadySent() || !hasConsent("marketing")) return;
        trackTikTok("CompletePayment", {
          value,
          currency: "RON",
          content_type: "product",
          contents: [{ content_id: pack, content_name: pack, quantity: 1, price: value }],
          order_id: transactionId,
          event_id: transactionId,
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
