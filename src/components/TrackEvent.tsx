"use client";

import { useEffect } from "react";

import { CONSENT_EVENT, readConsent } from "@/lib/meta/consent";
import { track, type StandardEvent } from "@/lib/meta/pixel";

/**
 * Raportează un eveniment Meta la afișarea unei pagini de server.
 *
 * Folosit acolo unde pagina nu are logică de client (de exemplu /pachete):
 * `<TrackEvent name="ViewContent" params={{ content_name: "pachete" }} />`.
 * Dacă acordul vine mai târziu, în timp ce pagina e deschisă, evenimentul
 * pleacă atunci — o singură dată.
 */
export function TrackEvent({
  name,
  params,
}: {
  name: StandardEvent;
  params?: Record<string, unknown>;
}) {
  useEffect(() => {
    let sent = false;
    function send() {
      if (sent || readConsent() !== "granted") return;
      sent = true;
      // Pixelul se încarcă în MetaPixel; un tick de așteptare îi lasă loc.
      setTimeout(() => track(name, params), 0);
    }

    send();
    window.addEventListener(CONSENT_EVENT, send);
    return () => window.removeEventListener(CONSENT_EVENT, send);
    // params e un obiect literal nou la fiecare randare; îl citim doar la montare.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return null;
}
