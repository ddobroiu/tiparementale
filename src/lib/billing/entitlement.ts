import type { PoolClient } from "pg";

import { costMicro, type TokenUsage } from "./pricing";

/**
 * Ce are voie să facă un cont acum, și cât a consumat.
 *
 * Verificarea se face *înainte* de apelul la model, nu după. Un plafon
 * verificat după ce ai plătit apelul nu este un plafon.
 */

export type PlanCode = "free" | "explorare" | "lucru";
export type UsageKind = "reply" | "extraction" | "transformation";

export interface Entitlement {
  plan: PlanCode;
  planName: string;
  priceEur: number;
  sessionsIncluded: number;
  sessionsUsed: number;
  transformationsIncluded: number;
  transformationsUsed: number;
  maxTurnsPerSession: number;
  costCeilingMicro: number;
  costUsedMicro: number;
  periodEnd: string;
}

interface Row extends Record<string, unknown> {
  plan: PlanCode;
  name: string;
  price_eur: string;
  sessions_included: number;
  sessions_used: number;
  transformations_included: number;
  transformations_used: number;
  max_turns_per_session: number;
  cost_ceiling_micro: string;
  cost_used_micro: string;
  period_end: string;
}

/**
 * Citește dreptul curent, rulând perioada mai departe dacă a expirat.
 * Reînnoirea aici, la citire, ține locul unui job programat.
 */
export async function getEntitlement(
  client: PoolClient,
  userId: string,
): Promise<Entitlement> {
  await client.query(
    `update subscriptions
        set period_start = now(),
            period_end = now() + interval '30 days',
            sessions_used = 0,
            transformations_used = 0,
            cost_used_micro = 0
      where user_id = $1 and period_end < now()`,
    [userId],
  );

  const { rows } = await client.query<Row>(
    `select s.plan, p.name, p.price_eur, p.sessions_included, s.sessions_used,
            p.transformations_included, s.transformations_used,
            p.max_turns_per_session, p.cost_ceiling_micro, s.cost_used_micro,
            s.period_end
       from subscriptions s
       join plans p on p.code = s.plan
      where s.user_id = $1`,
    [userId],
  );

  const row = rows[0];

  return {
    plan: row.plan,
    planName: row.name,
    priceEur: Number(row.price_eur),
    sessionsIncluded: row.sessions_included,
    sessionsUsed: row.sessions_used,
    transformationsIncluded: row.transformations_included,
    transformationsUsed: row.transformations_used,
    maxTurnsPerSession: row.max_turns_per_session,
    costCeilingMicro: Number(row.cost_ceiling_micro),
    costUsedMicro: Number(row.cost_used_micro),
    periodEnd: row.period_end,
  };
}

export type Denial = { allowed: false; reason: string; code: string };
export type Allowance = { allowed: true };
export type Decision = Allowance | Denial;

/**
 * Plafonul de cost este ultima linie de apărare, verificată la fiecare apel.
 * Ședințele și transformările se pot epuiza din uz normal; plafonul se atinge
 * doar dacă ceva a scăpat de sub control.
 */
function withinCostCeiling(entitlement: Entitlement): Decision {
  if (entitlement.costUsedMicro >= entitlement.costCeilingMicro) {
    return {
      allowed: false,
      code: "cost_ceiling",
      reason:
        "Ai atins limita de consum pentru perioada aceasta. Se reînnoiește " +
        "la începutul perioadei următoare.",
    };
  }
  return { allowed: true };
}

export function canStartSession(entitlement: Entitlement): Decision {
  const ceiling = withinCostCeiling(entitlement);
  if (!ceiling.allowed) return ceiling;

  if (entitlement.sessionsUsed >= entitlement.sessionsIncluded) {
    return {
      allowed: false,
      code: "no_sessions",
      reason:
        entitlement.plan === "free"
          ? "Prima ședință s-a încheiat. Alege un plan ca să continui harta."
          : "Ai folosit toate ședințele din perioada aceasta.",
    };
  }

  return { allowed: true };
}

export function canContinueSession(entitlement: Entitlement, turns: number): Decision {
  const ceiling = withinCostCeiling(entitlement);
  if (!ceiling.allowed) return ceiling;

  if (turns >= entitlement.maxTurnsPerSession) {
    return {
      allowed: false,
      code: "session_full",
      reason:
        "Ședința aceasta s-a încheiat. Închide panoul ca să vezi ce s-a " +
        "schimbat în hartă, apoi începe una nouă când vrei.",
    };
  }

  return { allowed: true };
}

export function canTransform(entitlement: Entitlement): Decision {
  const ceiling = withinCostCeiling(entitlement);
  if (!ceiling.allowed) return ceiling;

  if (entitlement.transformationsUsed >= entitlement.transformationsIncluded) {
    return {
      allowed: false,
      code: "no_transformations",
      reason: "Ai folosit toate lucrările de transformare din perioada aceasta.",
    };
  }

  return { allowed: true };
}

// ---------------------------------------------------------------- consum

export async function recordUsage(
  client: PoolClient,
  input: {
    userId: string;
    conversationId: string | null;
    kind: UsageKind;
    model: string;
    usage: TokenUsage;
  },
): Promise<number> {
  const cost = costMicro(input.model, input.usage);

  await client.query(
    `insert into usage_events
       (user_id, conversation_id, kind, model, input_tokens, output_tokens,
        cache_read_tokens, cache_write_tokens, cost_micro)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.userId,
      input.conversationId,
      input.kind,
      input.model,
      input.usage.input_tokens,
      input.usage.output_tokens,
      input.usage.cache_read_tokens,
      input.usage.cache_write_tokens,
      cost,
    ],
  );

  await client.query(
    "update subscriptions set cost_used_micro = cost_used_micro + $1 where user_id = $2",
    [cost, input.userId],
  );

  return cost;
}

export async function countSession(client: PoolClient, userId: string): Promise<void> {
  await client.query(
    "update subscriptions set sessions_used = sessions_used + 1 where user_id = $1",
    [userId],
  );
}

export async function countTransformation(
  client: PoolClient,
  userId: string,
): Promise<void> {
  await client.query(
    "update subscriptions set transformations_used = transformations_used + 1 where user_id = $1",
    [userId],
  );
}
