import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { runReply } from "@/lib/conversation/reply";
import { withUser } from "@/lib/db";
import type { MindNode } from "@/lib/types";

const HISTORY_LIMIT = 12;

/** După câte replici neprelucrate merită pornită extracția. */
const EXTRACTION_THRESHOLD = 4;

/**
 * Calea fierbinte: doar replica din conversație.
 *
 * Extracția nu se face aici. Ea rulează separat, pe mai multe mesaje odată,
 * prin `/api/conversations/[id]/extract`, iar răspunsul de mai jos spune
 * clientului când e momentul s-o pornească.
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
    let conversationId = requestedConversation;

    if (conversationId) {
      const { rows } = await client.query<{ id: string }>(
        "select id from conversations where id = $1",
        [conversationId],
      );
      if (rows.length === 0) conversationId = null;
    }

    if (!conversationId) {
      const { rows } = await client.query<{ id: string }>(
        "insert into conversations (user_id) values ($1) returning id",
        [user.id],
      );
      conversationId = rows[0].id;
    }

    const { rows: saved } = await client.query<{ id: string }>(
      `insert into messages (user_id, conversation_id, role, content, input_mode)
       values ($1, $2, 'user', $3, $4)
       returning id`,
      [user.id, conversationId, message, inputMode],
    );

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

    return { conversationId, nodes, history: history.reverse() };
  });

  const result = await runReply({
    nodes: context.nodes,
    history: context.history,
    message,
  });

  const reply = result.ok ? result.reply.reply : result.reply;
  const safetyFlag = result.ok ? result.reply.safety_flag : result.safety;

  const pending = await withUser(user.id, async (client) => {
    await client.query(
      `insert into messages (user_id, conversation_id, role, content)
       values ($1, $2, 'assistant', $3)`,
      [user.id, context.conversationId, reply],
    );

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
    extractionDue: pending >= EXTRACTION_THRESHOLD,
  });
}
