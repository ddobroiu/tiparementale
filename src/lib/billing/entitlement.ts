import type { PoolClient } from "pg";

import { costMicro, type TokenUsage } from "./pricing";

/**
 * Ce are omul în portofel, acum.
 *
 * Fără abonament și fără perioade: ședințele se cumpără în pachete și nu
 * expiră. Verificarea se face *înainte* de apelul la model — un plafon
 * verificat după ce ai plătit apelul nu este un plafon.
 */

export type UsageKind = "reply" | "extraction" | "transformation";

/** Cât ține o ședință. Aceeași pentru toți: se vând mai multe, nu mai lungi. */
export const MAX_TURNS_PER_SESSION = 25;

export interface Wallet {
  sessionsLeft: number;
  transformationsLeft: number;
  costCeilingMicro: number;
  costUsedMicro: number;
}

interface Row extends Record<string, unknown> {
  sessions_balance: number;
  transformations_balance: number;
  cost_ceiling_micro: string;
  cost_used_micro: string;
}

export async function getWallet(client: PoolClient, userId: string): Promise<Wallet> {
  const { rows } = await client.query<Row>(
    `select sessions_balance, transformations_balance, cost_ceiling_micro, cost_used_micro
       from wallets where user_id = $1`,
    [userId],
  );

  const row = rows[0];
  if (!row) {
    return {
      sessionsLeft: 0,
      transformationsLeft: 0,
      costCeilingMicro: 0,
      costUsedMicro: 0,
    };
  }

  return {
    sessionsLeft: row.sessions_balance,
    transformationsLeft: row.transformations_balance,
    costCeilingMicro: Number(row.cost_ceiling_micro),
    costUsedMicro: Number(row.cost_used_micro),
  };
}

export type Denial = { allowed: false; reason: string; code: string };
export type Decision = { allowed: true } | Denial;

/**
 * Plafonul de cost crește cu fiecare pachet cumpărat, deci nu poate depăși
 * niciodată ce a plătit omul. Este ultima linie de apărare: ședințele se
 * epuizează din uz normal, plafonul se atinge doar dacă ceva a scăpat de sub
 * control.
 */
function withinCeiling(wallet: Wallet): Decision {
  if (wallet.costUsedMicro >= wallet.costCeilingMicro) {
    return {
      allowed: false,
      code: "cost_ceiling",
      reason:
        "Am atins o limită tehnică de siguranță pe contul tău. Scrie-ne și o " +
        "ridicăm — nu pierzi nimic din ce ai cumpărat.",
    };
  }
  return { allowed: true };
}

export function canStartSession(wallet: Wallet): Decision {
  const ceiling = withinCeiling(wallet);
  if (!ceiling.allowed) return ceiling;

  if (wallet.sessionsLeft <= 0) {
    return {
      allowed: false,
      code: "no_sessions",
      reason: "Nu mai ai ședințe. Alege un pachet ca să continui harta.",
    };
  }

  return { allowed: true };
}

export function canContinueSession(wallet: Wallet, turns: number): Decision {
  const ceiling = withinCeiling(wallet);
  if (!ceiling.allowed) return ceiling;

  if (turns >= MAX_TURNS_PER_SESSION) {
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

export function canTransform(wallet: Wallet): Decision {
  const ceiling = withinCeiling(wallet);
  if (!ceiling.allowed) return ceiling;

  if (wallet.transformationsLeft <= 0) {
    return {
      allowed: false,
      code: "no_transformations",
      reason: "Nu mai ai lucrări de transformare. Sunt incluse în orice pachet.",
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
    "update wallets set cost_used_micro = cost_used_micro + $1 where user_id = $2",
    [cost, input.userId],
  );

  return cost;
}

/**
 * Scade o ședință. Condiția din `where` face scăderea atomică: două cereri
 * pornite în același timp nu pot consuma amândouă ultima ședință.
 */
export async function spendSession(client: PoolClient, userId: string): Promise<boolean> {
  const { rowCount } = await client.query(
    `update wallets set sessions_balance = sessions_balance - 1
      where user_id = $1 and sessions_balance > 0`,
    [userId],
  );
  return rowCount === 1;
}

export async function spendTransformation(
  client: PoolClient,
  userId: string,
): Promise<boolean> {
  const { rowCount } = await client.query(
    `update wallets set transformations_balance = transformations_balance - 1
      where user_id = $1 and transformations_balance > 0`,
    [userId],
  );
  return rowCount === 1;
}
