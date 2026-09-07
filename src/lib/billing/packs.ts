import type { PoolClient } from "pg";

import { query } from "@/lib/db";

export interface Pack {
  code: string;
  name: string;
  priceRon: number;
  sessions: number;
  transformations: number;
  costCeilingMicro: number;
}

interface PackRow extends Record<string, unknown> {
  code: string;
  name: string;
  price_ron: string;
  sessions: number;
  transformations: number;
  cost_ceiling_micro: string;
}

function toPack(row: PackRow): Pack {
  return {
    code: row.code,
    name: row.name,
    priceRon: Number(row.price_ron),
    sessions: row.sessions,
    transformations: row.transformations,
    costCeilingMicro: Number(row.cost_ceiling_micro),
  };
}

/** Catalogul e public: nu are nevoie de context de utilizator. */
export async function listPacks(): Promise<Pack[]> {
  const rows = await query<PackRow>(
    "select * from packs where active order by sort_order",
  );
  return rows.map(toPack);
}

export async function getPack(code: string): Promise<Pack | null> {
  const rows = await query<PackRow>("select * from packs where code = $1 and active", [code]);
  return rows[0] ? toPack(rows[0]) : null;
}

/**
 * Creditează portofelul după o plată confirmată.
 *
 * Se face o singură dată per plată: `provider_ref` este unic, iar trecerea la
 * `paid` are condiția `status = 'pending'` în `where`. Stripe trimite același
 * eveniment de mai multe ori prin proiectare, deci a doua livrare trebuie să
 * nu schimbe nimic.
 */
export async function creditPurchase(
  client: PoolClient,
  providerRef: string,
): Promise<{ credited: boolean; userId: string | null }> {
  const { rows } = await client.query<{ user_id: string; pack_code: string }>(
    `update purchases set status = 'paid', completed_at = now()
      where provider_ref = $1 and status = 'pending'
      returning user_id, pack_code`,
    [providerRef],
  );

  const purchase = rows[0];
  if (!purchase) return { credited: false, userId: null };

  await client.query(
    `update wallets w
        set sessions_balance = w.sessions_balance + p.sessions,
            transformations_balance = w.transformations_balance + p.transformations,
            cost_ceiling_micro = w.cost_ceiling_micro + p.cost_ceiling_micro
       from packs p
      where w.user_id = $1 and p.code = $2`,
    [purchase.user_id, purchase.pack_code],
  );

  return { credited: true, userId: purchase.user_id };
}
