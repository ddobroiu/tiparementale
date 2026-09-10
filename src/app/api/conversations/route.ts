import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { canStartSession, getWallet, spendSession } from "@/lib/billing/entitlement";
import { withUser } from "@/lib/db";
import { getGuide } from "@/lib/guides";
import { findTopic } from "@/lib/topics";
import { EXPLORABLE_DOMAINS, type LifeDomain } from "@/lib/types";

/**
 * Deschide o ședință — pe un ghid (temă cu parcurs) sau pe un subiect simplu.
 *
 * Prima întrebare este scrisă dinainte, nu generată: e primul lucru pe care îl
 * citește omul, merită să fie formulată bine, și nu are rost să plătim un apel
 * la model pentru un text care nu depinde de nimic. La ghiduri vine cu
 * variantele de răspuns ale primului pas, dacă are.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const guide = typeof body?.guideId === "string" ? getGuide(body.guideId) : null;
  const topic = typeof body?.topicId === "string" ? findTopic(body.topicId) : null;

  const domain: LifeDomain | null = guide
    ? guide.domain
    : EXPLORABLE_DOMAINS.includes(body?.domain)
      ? body.domain
      : null;

  const opener = guide ? guide.steps[0].question : topic?.opener ?? null;
  const options = guide ? guide.steps[0].options ?? null : null;

  const outcome = await withUser(user.id, async (client) => {
    const wallet = await getWallet(client, user.id);
    const decision = canStartSession(wallet);
    if (!decision.allowed) return { denied: decision };

    if (!(await spendSession(client, user.id))) {
      return {
        denied: {
          allowed: false as const,
          code: "no_sessions",
          reason: "Nu mai ai ședințe. Alege un pachet ca să continui harta.",
        },
      };
    }

    const { rows } = await client.query<{ id: string }>(
      `insert into conversations (user_id, domain, guide_id)
       values ($1, $2, $3) returning id`,
      [user.id, domain, guide?.id ?? null],
    );
    const conversationId = rows[0].id;

    if (opener) {
      await client.query(
        `insert into messages (user_id, conversation_id, role, content, options)
         values ($1, $2, 'assistant', $3, $4)`,
        [user.id, conversationId, opener, options ? JSON.stringify(options) : null],
      );
    }

    return { denied: null, conversationId, opener, options };
  });

  if (outcome.denied) {
    return NextResponse.json(
      { error: outcome.denied.reason, code: outcome.denied.code },
      { status: 402 },
    );
  }

  return NextResponse.json({
    conversationId: outcome.conversationId,
    opener: outcome.opener,
    options: outcome.options,
    guideTitle: guide?.title ?? null,
  });
}
