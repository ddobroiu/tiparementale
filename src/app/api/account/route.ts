import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { MAX_TURNS_PER_SESSION, getWallet } from "@/lib/billing/entitlement";
import { withUser } from "@/lib/db";
import { loadLessonProgress } from "@/lib/lessons";

/** Ce are omul în portofel. Ședințele nu expiră. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { wallet, lessons } = await withUser(user.id, async (client) => ({
    wallet: await getWallet(client, user.id),
    lessons: await loadLessonProgress(client),
  }));

  return NextResponse.json({
    sessionsLeft: wallet.sessionsLeft,
    transformationsLeft: wallet.transformationsLeft,
    maxTurnsPerSession: MAX_TURNS_PER_SESSION,
    lessons,
  });
}
