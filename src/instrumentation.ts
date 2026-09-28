import { alerta } from "./lib/alerts";

// Erorile server necapturate (pagini, route handlers, server actions, proxy) ajung in mydashboard ca alerta „error”.
// Cheia: request:<ruta>; mesajul: metoda, ruta, eroarea si 3 linii din stack (fara query string, headere sau date personale).
// Cel mult o trimitere la 10 minute pe cheie (in proces). Nu arunca niciodata.
const THROTTLE_MS = 10 * 60_000;
const lastSent = new Map<string, number>();

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string },
  context: { routePath?: string; routeType?: string },
): Promise<void> {
  try {
    const e = (typeof err === "object" && err !== null ? err : {}) as { message?: unknown; stack?: unknown; digest?: unknown };
    const digest = typeof e.digest === "string" ? e.digest : "";
    // redirect() / notFound() nu sunt erori
    if (/^NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR_FALLBACK)/.test(digest)) return;
    const route = context?.routePath || String(request?.path ?? "").split("?")[0] || "necunoscuta";
    const key = `request:${route}`.slice(0, 80);
    const now = Date.now();
    if (now - (lastSent.get(key) ?? 0) < THROTTLE_MS) return;
    lastSent.set(key, now);
    if (lastSent.size > 200) for (const [k, t] of lastSent) if (now - t >= THROTTLE_MS) lastSent.delete(k);
    const message = (typeof e.message === "string" && e.message) || String(err);
    const stack = typeof e.stack === "string" ? e.stack.split("\n").slice(1, 4).map((l) => l.trim()).join("\n") : "";
    const text = `${request?.method ?? "?"} ${route}${context?.routeType ? ` (${context.routeType})` : ""}: ${message.slice(0, 300)}${digest ? ` [digest ${digest}]` : ""}${stack ? `\n${stack}` : ""}`;
    await alerta("error", key, text);
  } catch {
    /* raportarea nu blocheaza niciodata aplicatia */
  }
}
