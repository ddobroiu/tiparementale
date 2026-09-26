"use client";

import { openConsentSettings } from "@/lib/meta/consent";

/** Redeschide bannerul de cookie-uri, ca alegerea să poată fi schimbată oricând. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      Setări cookies
    </button>
  );
}
