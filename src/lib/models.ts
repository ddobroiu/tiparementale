/**
 * Ce model face fiecare meserie, și cât de tare gândește.
 *
 * Reglabil din mediu, ca raportul cost/calitate să se poată schimba fără
 * modificare de cod: pui altă valoare, repornești, și compari costul real în
 * `usage_events`.
 *
 * Alegerea implicită vine dintr-o măsurătoare: conversația nu este costul — o
 * extracție costă cât șaptesprezece replici. Deci replicile merg pe cel mai
 * ieftin model care le face bine, extracția pe unul mijlociu dar mai rar, iar
 * transformarea rămâne pe cel mai bun, fiindcă se întâmplă o singură dată per
 * convingere și este momentul care convinge omul.
 */

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export const MODELS = {
  reply: process.env.MODEL_REPLY ?? "claude-haiku-4-5",
  extraction: process.env.MODEL_EXTRACTION ?? "claude-sonnet-5",
  transformation: process.env.MODEL_TRANSFORMATION ?? "claude-opus-5",
  prediction: process.env.MODEL_PREDICTION ?? "claude-sonnet-5",
} as const;

/** După câte replici neprelucrate pornește extracția. */
export const EXTRACTION_THRESHOLD = Number(process.env.EXTRACTION_THRESHOLD ?? 8);

/**
 * Cât de tare gândește fiecare meserie.
 *
 * La extracție, măsurătoarea arată că ~90% din cost sunt tokenii de ieșire —
 * 1.423 scriși față de 673 citiți — iar cea mai mare parte din ei sunt gândire,
 * nu rezultat. Deci pârghia adevărată nu este cât îi trimitem, ci cât
 * deliberează. „medium" taie mult din asta fără să strice deciziile de
 * fuziune, care sunt oricum ghidate de schemă.
 *
 * Transformarea rămâne sus: se întâmplă o dată per convingere și este momentul
 * care convinge omul să plătească.
 */
function effortFromEnv(name: string, fallback: Effort): Effort {
  const value = process.env[name];
  const allowed: Effort[] = ["low", "medium", "high", "xhigh", "max"];
  return allowed.includes(value as Effort) ? (value as Effort) : fallback;
}

export const EFFORT = {
  reply: effortFromEnv("EFFORT_REPLY", "low"),
  extraction: effortFromEnv("EFFORT_EXTRACTION", "medium"),
  transformation: effortFromEnv("EFFORT_TRANSFORMATION", "high"),
  prediction: effortFromEnv("EFFORT_PREDICTION", "medium"),
} as const;

/**
 * Haiku 4.5 nu cunoaște nici gândirea adaptivă, nici `effort`: trimise către
 * el, întorc 400. Modelele din generația 5 le acceptă pe amândouă. Diferența
 * stă aici, într-un singur loc, ca apelurile să nu se umple de condiționale.
 */
function isLegacyReasoning(model: string): boolean {
  return model.startsWith("claude-haiku-4-5") || model.startsWith("claude-sonnet-4");
}

export interface Reasoning {
  thinking?: { type: "adaptive" };
  effort?: Effort;
}

export function reasoningFor(model: string, effort: Effort): Reasoning {
  if (isLegacyReasoning(model)) return {};
  return { thinking: { type: "adaptive" }, effort };
}
