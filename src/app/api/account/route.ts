import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getEntitlement } from "@/lib/billing/entitlement";
import { withUser } from "@/lib/db";

/** Ce mai are omul la dispoziție în perioada curentă. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const entitlement = await withUser(user.id, (client) => getEntitlement(client, user.id));

  return NextResponse.json({
    plan: entitlement.plan,
    planName: entitlement.planName,
    priceEur: entitlement.priceEur,
    sessionsLeft: Math.max(0, entitlement.sessionsIncluded - entitlement.sessionsUsed),
    sessionsIncluded: entitlement.sessionsIncluded,
    transformationsLeft: Math.max(
      0,
      entitlement.transformationsIncluded - entitlement.transformationsUsed,
    ),
    transformationsIncluded: entitlement.transformationsIncluded,
    maxTurnsPerSession: entitlement.maxTurnsPerSession,
    periodEnd: entitlement.periodEnd,
  });
}
