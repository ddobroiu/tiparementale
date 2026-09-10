"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { GA_ID, loadGa } from "@/lib/ga";
import { CONSENT_EVENT, readConsent, type Consent } from "@/lib/meta/consent";
import { PIXEL_ID, loadPixel, trackPageView } from "@/lib/meta/pixel";

/**
 * Încarcă Meta Pixel și Google Analytics și raportează PageView la fiecare
 * schimbare de pagină.
 *
 * Nu pune nimic în pagină până nu există acord: scriptul de la Meta se
 * descarcă abia după „Accept" din banner (sau imediat, dacă acordul e deja
 * dat de la o vizită anterioară). Fără acord, componenta e complet inertă.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  // Pornirea: la montare sau când vizitatorul își dă acordul.
  useEffect(() => {
    if (!PIXEL_ID && !GA_ID) return;

    function start() {
      loadPixel();
      loadGa();
      trackPageView();
      lastPath.current = pathname;
    }

    if (readConsent() === "granted") start();

    function onConsent(event: Event) {
      const value = (event as CustomEvent<Consent>).detail;
      if (value === "granted") start();
    }
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
    // pathname e citit intenționat doar la pornire; navigarea e tratată mai jos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigarea în aplicație (fără reîncărcare) nu declanșează PageView singură.
  useEffect(() => {
    if (lastPath.current === null || lastPath.current === pathname) return;
    lastPath.current = pathname;
    trackPageView();
  }, [pathname]);

  return null;
}
