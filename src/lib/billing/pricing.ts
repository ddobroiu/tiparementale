/**
 * Costul real al unui apel, calculat din tokenii raportați de API.
 *
 * Marja produsului nu se estimează, se măsoară: dacă prețurile de mai jos se
 * schimbă, se schimbă într-un singur loc, iar tot ce s-a înregistrat până
 * atunci rămâne cu costul de la momentul respectiv.
 */

/** Preț per milion de tokeni, în dolari. */
interface ModelPrice {
  input: number;
  output: number;
}

const PRICES: Record<string, ModelPrice> = {
  "claude-opus-5": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

/** Citirea din cache costă a zecea parte; scrierea, un sfert în plus. */
const CACHE_READ_FACTOR = 0.1;
const CACHE_WRITE_FACTOR = 1.25;

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
}

/** Forma raportată de SDK, cu numele lui pentru câmpurile de cache. */
export interface ApiUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

export function readUsage(usage: ApiUsage | null | undefined): TokenUsage {
  return {
    input_tokens: usage?.input_tokens ?? 0,
    output_tokens: usage?.output_tokens ?? 0,
    cache_read_tokens: usage?.cache_read_input_tokens ?? 0,
    cache_write_tokens: usage?.cache_creation_input_tokens ?? 0,
  };
}

/**
 * Costul în micro-dolari. Se lucrează în întregi ca să nu se acumuleze erori
 * de virgulă mobilă peste zeci de mii de apeluri.
 *
 * Un token la un preț de X dolari per milion costă exact X micro-dolari, deci
 * înmulțirea de mai jos nu are nevoie de nicio scalare.
 */
export function costMicro(model: string, usage: TokenUsage): number {
  const price = PRICES[model];
  if (!price) return 0;

  const total =
    usage.input_tokens * price.input +
    usage.output_tokens * price.output +
    usage.cache_read_tokens * price.input * CACHE_READ_FACTOR +
    usage.cache_write_tokens * price.input * CACHE_WRITE_FACTOR;

  return Math.round(total);
}

export function formatEur(micro: number): string {
  return `${(micro / 1_000_000).toFixed(3)} $`;
}
