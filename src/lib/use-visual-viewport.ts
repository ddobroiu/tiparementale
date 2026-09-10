"use client";

import { useSyncExternalStore } from "react";

/**
 * Fereastra vizibilă a telefonului, așa cum o lasă tastatura.
 *
 * Pe iOS, când se deschide tastatura, pagina nu se micșorează: `100dvh`
 * rămâne cât ecranul întreg, iar tot ce e „fixat jos” ajunge sub tastatură.
 * Singurul lucru care spune adevărul e `window.visualViewport`. Hook-ul îl
 * citește și îl urmărește; pe calculator, sau unde nu există, întoarce
 * `null` și nimic nu se schimbă.
 */
export interface VisualViewport {
  height: number;
  offsetTop: number;
  /** Tastatura e deschisă: fereastra vizibilă e clar mai mică decât ecranul. */
  keyboardOpen: boolean;
}

const MOBILE = "(max-width: 639px)";

function subscribe(notify: () => void): () => void {
  const vv = window.visualViewport;
  if (!vv) return () => {};
  vv.addEventListener("resize", notify);
  vv.addEventListener("scroll", notify);
  window.addEventListener("resize", notify);
  return () => {
    vv.removeEventListener("resize", notify);
    vv.removeEventListener("scroll", notify);
    window.removeEventListener("resize", notify);
  };
}

let cached: VisualViewport | null = null;

/** Același obiect cât timp valorile nu se schimbă: altfel React ar rerandă la nesfârșit. */
function snapshot(): VisualViewport | null {
  const vv = window.visualViewport;
  if (!vv || !window.matchMedia(MOBILE).matches) return null;

  const height = Math.round(vv.height);
  const offsetTop = Math.round(vv.offsetTop);
  const keyboardOpen = height < window.innerHeight * 0.8;

  if (
    cached &&
    cached.height === height &&
    cached.offsetTop === offsetTop &&
    cached.keyboardOpen === keyboardOpen
  ) {
    return cached;
  }
  cached = { height, offsetTop, keyboardOpen };
  return cached;
}

export function useVisualViewport(): VisualViewport | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
