import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  MAX_TURNS_PER_SESSION,
  canContinueSession,
  canStartSession,
  getWallet,
  recordUsage,
  spendSession,
} from "@/lib/billing/entitlement";
import { REPLY_MODEL, runReply } from "@/lib/conversation/reply";
import { EXTRACTION_THRESHOLD } from "@/lib/models";
import { withUser } from "@/lib/db";
import type { MindNode } from "@/lib/types";

const HISTORY_LIMIT = 12;




/**
 * Calea fierbinte: doar replica din conversație.
 *
 * Dreptul de a vorbi se verifică *înainte* de apelul la model. Un plafon
 * verificat după ce ai plătit apelul nu este un plafon.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const message: unknown = body?.message;

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Mesaj gol" }, { status: 400 });
  }

  const inputMode = body?.inputMode === "voice" ? "voice" : "text";
  const requestedConversation: string | null = body?.conversationId ?? null;

  const context = await withUser(user.id, async (client) => {
    const wallet = await getWallet(client, user.id);

    let conversationId = requestedConversation;
    let turns = 0;

    if (conversationId) {
      const { rows } = await client.query<{ id: string; turns: number }>(
        "select id, turns from conversations where id = $1 and closed_at is null",
        [conversationId],
      );
      if (rows.length === 0) {
        conversationId = null;
      } else {
        turns = rows[0].turns;
      }
    }

    // Ședință nouă: se cere una din cele incluse în plan.
    if (!conversationId) {
      const decision = canStartSession(wallet);
      if (!decision.allowed) return { denied: decision };

      // Scăderea atomică e cea care decide: dacă nu a mers, altcineva a luat
      // ultima ședință între verificare și aici.
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
        "insert into conversations (user_id) values ($1) returning id",
        [user.id],
      );
      conversationId = rows[0].id;
    } else {
      const decision = canContinueSession(wallet, turns);
      if (!decision.allowed) return { denied: decision };
    }

    const { rows: saved } = await client.query<{ id: string }>(
      `insert into messages (user_id, conversation_id, role, content, input_mode)
       values ($1, $2, 'user', $3, $4)
       returning id`,
      [user.id, conversationId, message, inputMode],
    );

    await client.query("update conversations set turns = turns + 1 where id = $1", [
      conversationId,
    ]);

    const { rows: nodes } = await client.query<MindNode>(
      "select * from nodes where archived_at is null order by created_at",
    );

    const { rows: history } = await client.query<{ role: "user" | "assistant"; content: string }>(
      `select role, content from messages
        where conversation_id = $1 and id <> $2
        order by created_at desc
        limit $3`,
      [conversationId, saved[0].id, HISTORY_LIMIT],
    );

    return {
      denied: null,
      conversationId,
      turns: turns + 1,
      nodes,
      history: history.reverse(),
    };
  });

  if (context.denied) {
    return NextResponse.json(
      { error: context.denied.reason, code: context.denied.code },
      { status: 402 },
    );
  }

  const result = await runReply({
    nodes: context.nodes,
    history: context.history,
    message,
  });

  const reply = result.ok ? result.reply.reply : result.reply;
  const safetyFlag = result.ok ? result.reply.safety_flag : result.safety;

  const after = await withUser(user.id, async (client) => {
    await client.query(
      `insert into messages (user_id, conversation_id, role, content)
       values ($1, $2, 'assistant', $3)`,
      [user.id, context.conversationId, reply],
    );

    await recordUsage(client, {
      userId: user.id,
      conversationId: context.conversationId,
      kind: "reply",
      model: REPLY_MODEL,
      usage: result.usage,
    });

    const { rows } = await client.query<{ n: string }>(
      `select count(*) as n from messages
        where conversation_id = $1 and role = 'user' and extracted_at is null`,
      [context.conversationId],
    );

    return Number(rows[0].n);
  });

  return NextResponse.json({
    conversationId: context.conversationId,
    reply,
    safetyFlag,
    domainInFocus: result.ok ? result.reply.domain_in_focus : null,
    extractionDue: after >= EXTRACTION_THRESHOLD,
    turnsLeft: MAX_TURNS_PER_SESSION - context.turns,
  });
}
