// Consumul AI raportat catre mydashboard (POST {MYDASHBOARD_URL}/api/ingest/ai-usage), cu acelasi token ca /api/alert.
// Copia canonica: _deploy/shared/ai-usage.ts. In fiecare aplicatie se schimba DOAR constanta PROJECT (acelasi nume ca in
// lib/alerts.ts: tokenul MYDASHBOARD_ALERT_TOKEN e HMAC pe acest nume).
//
// Fara dependinte. Nu arunca niciodata si nu blocheaza cererea: evenimentele se strang in memorie si pleaca la 30 s,
// sau imediat cand apare o eroare. Fara MYDASHBOARD_ALERT_TOKEN (ex. local) nu face nimic.
//
// Folosire:
//   const r = await client.messages.create(...);  reportAnthropic("asistent", r.model, r.usage);
//   const r = await openai.chat.completions.create(...);  reportOpenAI("caption", r.model, r.usage);
//   catch (e) { reportAiError("anthropic", MODEL, "asistent", e); }
//   report({ provider: "replicate", model, feature: "imagine", seconds: predictTime, ok: true });

const PROJECT: string = "tiparementale";

export type AiProvider = "openai" | "anthropic" | "replicate" | "google" | "other";
export type AiErrorType = "credit" | "auth" | "rate" | "other";

// Un eveniment = un apel AI (sau `count` unitati: imagini, generari).
// inputTokens = TOTI tokenii de intrare, inclusiv cei cititi din cache (cachedTokens) si cei scrisi in cache (cacheWriteTokens).
export type AiUsageEvent = {
  provider: AiProvider;
  model: string;
  feature: string;
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  cacheWriteTokens?: number;
  // Replicate: durata rularii (metrics.predict_time), in secunde
  seconds?: number;
  // Cost estimat aici din tabelul de preturi; mydashboard il recalculeaza cand stie modelul
  costUsd?: number;
  count?: number;
  // ISO 8601; implicit acum
  ts?: string;
  ok: boolean;
  errorType?: AiErrorType;
  errorMessage?: string;
};

// ─── Preturi (USD pe 1M tokeni; cachedMul = cat costa un token citit din cache fata de unul normal) ─────
type Price = { in: number; out: number; cachedMul: number };
export const AI_PRICES: Record<string, Price> = {
  // OpenAI
  "gpt-5.6-luna": { in: 0.2, out: 1.2, cachedMul: 0.1 },
  "gpt-5.6-terra": { in: 2, out: 12, cachedMul: 0.1 },
  "gpt-5.6-sol": { in: 4, out: 20, cachedMul: 0.1 },
  "gpt-5-mini": { in: 0.25, out: 2, cachedMul: 0.1 },
  "gpt-4o-mini": { in: 0.15, out: 0.6, cachedMul: 0.5 },
  "gpt-4o": { in: 2.5, out: 10, cachedMul: 0.5 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6, cachedMul: 0.25 },
  // Anthropic (citirea din cache 0,1x; scrierea in cache 1,25x)
  "claude-haiku-4-5": { in: 1, out: 5, cachedMul: 0.1 },
  "claude-sonnet-5": { in: 2, out: 10, cachedMul: 0.1 },
  "claude-opus-5": { in: 5, out: 25, cachedMul: 0.1 },
  "claude-opus-5-5": { in: 4, out: 20, cachedMul: 0.1 },
};
const CACHE_WRITE_MUL = 1.25;
const PRICE_KEYS = Object.keys(AI_PRICES).sort((a, b) => b.length - a.length);

// Cel mai lung prefix: „claude-haiku-4-5-20251001” -> claude-haiku-4-5, „gpt-4o-mini-2024-07-18” -> gpt-4o-mini
export function priceOf(model: string): Price | null {
  const m = String(model || "").toLowerCase().replace(/^(openai|anthropic)\//, "");
  const k = PRICE_KEYS.find((key) => m === key || m.startsWith(`${key}-`) || m.startsWith(`${key}@`));
  return k ? AI_PRICES[k] : null;
}

// Replicate: pret pe rulare (modelele oficiale) sau pe secunda de GPU (replicate.com/pricing, septembrie 2026)
const GPU = { cpu: 0.0001, t4: 0.000225, l40s: 0.000975, a100: 0.0014, h100: 0.001525 };
export const REPLICATE_RATES: Record<string, { perRun?: number; perSecond?: number }> = {
  "black-forest-labs/flux-1.1-pro": { perRun: 0.04 },
  "black-forest-labs/flux-schnell": { perRun: 0.003 },
  "black-forest-labs/flux-dev": { perRun: 0.025 },
  "firtoz/trellis": { perSecond: GPU.a100 },
  "tencent/hunyuan3d-2mv": { perSecond: GPU.l40s },
  "tencent/hunyuan3d-2": { perSecond: GPU.l40s },
  "nightmareai/real-esrgan": { perSecond: GPU.t4 },
};

// Cost estimat; null cand nu stim pretul (se raporteaza doar numarul de apeluri)
export function estimateCostUsd(e: AiUsageEvent): number | null {
  if (typeof e.costUsd === "number" && Number.isFinite(e.costUsd)) return Math.max(0, e.costUsd);
  if (e.provider === "replicate") {
    const rate = REPLICATE_RATES[String(e.model).split(":")[0]];
    const n = e.count ?? 1;
    if (rate?.perRun !== undefined) return e.ok ? rate.perRun * n : 0;
    if (typeof e.seconds === "number" && e.seconds > 0) return e.seconds * (rate?.perSecond ?? GPU.l40s);
    return null;
  }
  const p = priceOf(e.model);
  if (!p) return null;
  const input = Math.max(0, e.inputTokens ?? 0);
  const cached = Math.min(input, Math.max(0, e.cachedTokens ?? 0));
  const written = Math.min(input - cached, Math.max(0, e.cacheWriteTokens ?? 0));
  const plain = input - cached - written;
  const out = Math.max(0, e.outputTokens ?? 0);
  return (plain * p.in + cached * p.in * p.cachedMul + written * p.in * CACHE_WRITE_MUL + out * p.out) / 1e6;
}

// ─── Clasificarea erorilor (SDK OpenAI / Anthropic / Replicate / fetch) ─────
type ErrLike = {
  status?: number;
  statusCode?: number;
  code?: string;
  type?: string;
  message?: string;
  response?: { status?: number };
  error?: { type?: string; code?: string; message?: string; error?: { type?: string; message?: string } };
};
const CREDIT_RE =
  /credit balance|insufficient[_ ]?(credit|funds|balance|quota)|out of credits|exceeded your current quota|billing[_ ]hard[_ ]limit|billing_not_active|payment required|spend(ing)? limit|monthly limit|RESOURCE_EXHAUSTED/i;
const AUTH_RE = /invalid[_ ]api[_ ]key|incorrect api key|invalid x-api-key|authentication[_ ]error|unauthori[sz]ed|permission[_ ]error|api key not valid/i;

export function classifyAiError(err: unknown): AiErrorType {
  const e = (typeof err === "object" && err !== null ? err : {}) as ErrLike;
  const status = e.status ?? e.statusCode ?? e.response?.status;
  const types = [e.type, e.code, e.error?.type, e.error?.code, e.error?.error?.type].filter(Boolean).join(" ");
  const text = `${e.message ?? (typeof err === "string" ? err : "")} ${e.error?.message ?? ""} ${e.error?.error?.message ?? ""} ${types}`;
  // insufficient_quota vine la OpenAI cu 429, deci creditul se verifica inaintea limitei de viteza
  if (status === 402 || /billing_error|insufficient_quota/.test(types) || CREDIT_RE.test(text)) return "credit";
  if (status === 401 || status === 403 || /authentication_error|permission_error|invalid_api_key/.test(types) || AUTH_RE.test(text)) return "auth";
  if (status === 429 || /rate_limit/.test(types) || /rate limit/i.test(text)) return "rate";
  return "other";
}

// ─── Coada si trimiterea ────────────────────────────────────────────────────
const FLUSH_MS = 30_000;
const MAX_QUEUE = 500;
type State = { queue: AiUsageEvent[]; timer: ReturnType<typeof setTimeout> | null };
const g = globalThis as unknown as { __aiUsage?: State };
const state: State = (g.__aiUsage ??= { queue: [], timer: null });

function endpoint(): string | null {
  const env = typeof process !== "undefined" ? process.env : ({} as Record<string, string | undefined>);
  if (!env.MYDASHBOARD_ALERT_TOKEN || PROJECT === "CHANGE_ME") return null;
  return `${(env.MYDASHBOARD_URL || "https://mydashboard.ro").replace(/\/+$/, "")}/api/ingest/ai-usage`;
}

export async function flushAiUsage(): Promise<void> {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  const url = endpoint();
  const events = state.queue.splice(0, state.queue.length);
  if (!url || !events.length) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-alert-token": process.env.MYDASHBOARD_ALERT_TOKEN as string },
      body: JSON.stringify({ project: PROJECT, events }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* raportarea nu blocheaza niciodata aplicatia; evenimentele pierdute nu se retrimit */
  }
}

export function report(event: AiUsageEvent): void {
  try {
    if (!endpoint()) return;
    const cost = estimateCostUsd(event);
    state.queue.push({
      ...event,
      model: String(event.model || "necunoscut").slice(0, 100),
      feature: String(event.feature || "general").slice(0, 60),
      ...(cost !== null && { costUsd: cost }),
      errorMessage: event.errorMessage?.slice(0, 300),
      ts: event.ts ?? new Date().toISOString(),
    });
    if (!event.ok || state.queue.length >= MAX_QUEUE) {
      void flushAiUsage();
    } else if (!state.timer) {
      state.timer = setTimeout(() => void flushAiUsage(), FLUSH_MS);
      (state.timer as { unref?: () => void }).unref?.();
    }
  } catch {
    /* niciodata nu arunca */
  }
}

// Anthropic: usage = { input_tokens, output_tokens, cache_read_input_tokens?, cache_creation_input_tokens? }
// (input_tokens NU include cache-ul, asa ca le adunam)
type AnthropicUsage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
} | null | undefined;
export function reportAnthropic(feature: string, model: string, usage: AnthropicUsage): void {
  const read = usage?.cache_read_input_tokens ?? 0;
  const write = usage?.cache_creation_input_tokens ?? 0;
  report({
    provider: "anthropic",
    model,
    feature,
    inputTokens: (usage?.input_tokens ?? 0) + read + write,
    outputTokens: usage?.output_tokens ?? 0,
    cachedTokens: read,
    cacheWriteTokens: write,
    ok: true,
  });
}

// OpenAI: Chat Completions (prompt_tokens / completion_tokens) sau Responses (input_tokens / output_tokens);
// cei din cache sunt deja inclusi in intrare.
type OpenAIUsage = {
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  prompt_tokens_details?: { cached_tokens?: number | null } | null;
  input_tokens_details?: { cached_tokens?: number | null } | null;
} | null | undefined;
export function reportOpenAI(feature: string, model: string, usage: OpenAIUsage): void {
  report({
    provider: "openai",
    model,
    feature,
    inputTokens: usage?.prompt_tokens ?? usage?.input_tokens ?? 0,
    outputTokens: usage?.completion_tokens ?? usage?.output_tokens ?? 0,
    cachedTokens: usage?.prompt_tokens_details?.cached_tokens ?? usage?.input_tokens_details?.cached_tokens ?? 0,
    ok: true,
  });
}

// In catch: trimite imediat eroarea clasificata (credit / auth / rate / other)
export function reportAiError(provider: AiProvider, model: string, feature: string, err: unknown): void {
  try {
    const e = err as { message?: unknown } | null;
    const message = typeof e?.message === "string" ? e.message : String(err);
    report({ provider, model, feature, ok: false, errorType: classifyAiError(err), errorMessage: message });
  } catch {
    /* niciodata nu arunca */
  }
}
