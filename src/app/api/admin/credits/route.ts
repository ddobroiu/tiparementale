import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { withAdmin } from "@/lib/db";

/**
 * Cât plafon tehnic aduce un credit adăugat de mână: același raport ca la
 * pachete (4 ședințe + 2 transformări = 6 milioane de micro-dolari), ca
 * omul să nu se lovească de plafon înainte să-și consume creditele.
 */
const CEILING_PER_CREDIT_MICRO = 1_000_000;
const MAX_STEP = 100;

interface WalletRow extends Record<string, unknown> {
  sessions_balance: number;
  transformations_balance: number;
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Doar pentru administratori." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const sessions = Number(body?.sessions ?? 0);
  const transformations = Number(body?.transformations ?? 0);
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 200) : "";

  const whole = (n: number) => Number.isInteger(n) && Math.abs(n) <= MAX_STEP;
  if (!userId || !whole(sessions) || !whole(transformations)) {
    return NextResponse.json({ error: "Valori invalide." }, { status: 400 });
  }
  if (sessions === 0 && transformations === 0) {
    return NextResponse.json({ error: "Nimic de schimbat." }, { status: 400 });
  }

  // Plafonul crește doar la adăugare. La scădere rămâne unde e: e o plasă de
  // siguranță, nu o cantitate — coborât, ar bloca ședințe încă plătite.
  const ceilingDelta =
    (Math.max(sessions, 0) + Math.max(transformations, 0)) * CEILING_PER_CREDIT_MICRO;

  const wallet = await withAdmin(async (client) => {
    const { rows: users } = await client.query("select id from users where id = $1", [userId]);
    if (users.length === 0) return null;

    // Portofelul există de la înregistrare; `on conflict` acoperă conturile
    // mai vechi decât declanșatorul. Soldurile nu coboară sub zero, iar
    // plafonul nu coboară sub ce s-a consumat deja.
    const { rows } = await client.query<WalletRow>(
      `insert into wallets (user_id, sessions_balance, transformations_balance, cost_ceiling_micro)
       values ($1, greatest($2, 0), greatest($3, 0), greatest($4, 0))
       on conflict (user_id) do update set
         sessions_balance        = greatest(wallets.sessions_balance + $2, 0),
         transformations_balance = greatest(wallets.transformations_balance + $3, 0),
         cost_ceiling_micro      = greatest(wallets.cost_ceiling_micro + $4, wallets.cost_used_micro)
       returning sessions_balance, transformations_balance`,
      [userId, sessions, transformations, ceilingDelta],
    );

    await client.query(
      `insert into wallet_adjustments
         (user_id, admin_email, sessions_delta, transformations_delta, cost_ceiling_delta_micro, note)
       values ($1, $2, $3, $4, $5, $6)`,
      [userId, admin.email, sessions, transformations, ceilingDelta, note || null],
    );

    return rows[0];
  });

  if (!wallet) {
    return NextResponse.json({ error: "Utilizatorul nu există." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    wallet: {
      sessionsLeft: wallet.sessions_balance,
      transformationsLeft: wallet.transformations_balance,
    },
  });
}
