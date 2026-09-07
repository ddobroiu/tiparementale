import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { canStartSession, getWallet, spendSession } from "@/lib/billing/entitlement";
import { withUser } from "@/lib/db";
import { findTopic } from "@/lib/topics";
import { EXPLORABLE_DOMAINS, type LifeDomain } from "@/lib/types";

/**
 * Deschide o ședință pe un subiect ales.
 *
 * Întrebarea de deschidere este scrisă dinainte, nu generată: e primul lucru
 * pe care îl citește omul, merită să fie formulată bine, și nu are rost să
 * plătim un apel la model pentru un text care nu depinde de nimic.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const topic = typeof body?.topicId === "string" ? findTopic(body.topicId) : null;
  const domain: LifeDomain | null = EXPLORABLE_DOMAINS.includes(body?.domain)
    ? body.domain
    : null;

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
      "insert into conversations (user_id, domain) values ($1, $2) returning id",
      [user.id, domain],
    );
    const conversationId = rows[0].id;

    if (topic) {
      await client.query(
        `insert into messages (user_id, conversation_id, role, content)
         values ($1, $2, 'assistant', $3)`,
        [user.id, conversationId, topic.opener],
      );
    }

    return { denied: null, conversationId, opener: topic?.opener ?? null };
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
  });
}
