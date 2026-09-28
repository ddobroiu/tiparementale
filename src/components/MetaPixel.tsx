"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { loadClarity, revokeClarity, syncClarityWithPath } from "@/lib/clarity";
import { loadGa } from "@/lib/ga";
import { CONSENT_EVENT, readConsent, type ConsentChoice } from "@/lib/meta/consent";
import { loadPixel, setPixelConsent, trackPageView } from "@/lib/meta/pixel";
import { loadMydashboard, revokeMydashboard } from "@/lib/mydashboard";

/**
 * Încarcă scripturile de măsurare, fiecare doar cu acordul categoriei lui, și
 * raportează PageView la fiecare schimbare de pagină.
 *
 * - analitice: Google Analytics 4 (cu Consent Mode v2) și mydashboard.ro;
 * - marketing: Meta Pixel.
 *
 * Nu pune nimic în pagină până nu există acord; alegerile făcute ulterior din
 * banner se aplică fără reîncărcare (inclusiv retragerea acordului).
 */
export function MetaPixel() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    function apply(choice: ConsentChoice | null) {
      if (!choice) return;

      if (choice.analytics) loadMydashboard();
      else revokeMydashboard();

      // Microsoft Clarity: doar cu acord analitic și niciodată în aplicație (lib/clarity.ts).
      if (choice.analytics) loadClarity();
      else revokeClarity();

      // GA se încarcă doar cu acord analitic; dacă e deja încărcat, primește
      // actualizarea Consent Mode (inclusiv „denied”).
      loadGa(choice);

      if (choice.marketing) {
        loadPixel();
        setPixelConsent(true);
      } else {
        setPixelConsent(false);
      }

      if (lastPath.current === null && (choice.analytics || choice.marketing)) {
        trackPageView();
        lastPath.current = pathname;
      }
    }

    apply(readConsent());

    function onConsent(event: Event) {
      apply((event as CustomEvent<ConsentChoice>).detail);
    }
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
    // pathname e citit intenționat doar la pornire; navigarea e tratată mai jos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clarity se oprește în aplicație (hartă, setări, autentificare, admin) și se reia în afara ei.
  useEffect(() => {
    syncClarityWithPath(pathname, readConsent()?.analytics ?? false);
  }, [pathname]);

  // Navigarea în aplicație (fără reîncărcare) nu declanșează PageView singură.
  useEffect(() => {
    if (lastPath.current === null || lastPath.current === pathname) return;
    lastPath.current = pathname;
    trackPageView();
  }, [pathname]);

  return null;
}
