import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";
import { applyExtraction } from "@/lib/extraction/apply";
import { runExtraction } from "@/lib/extraction/extract";
import type { MindNode } from "@/lib/types";

const HISTORY_LIMIT = 10;

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

  // Prima tranzacție: salvăm mesajul și citim contextul. Se închide înainte de
  // apelul la model, ca să nu ținem o conexiune blocată câteva secunde.
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

    return {
      conversationId,
      messageId: saved[0].id,
      nodes,
      history: history.reverse(),
    };
  });

  // ------------------------------------------------------------ extracție

  const result = await runExtraction({
    nodes: context.nodes,
    history: context.history,
    message,
  });

  // A doua tranzacție: scriem ce a rezultat.
  const outcome = await withUser(user.id, async (client) => {
    const reply = result.ok ? result.extraction.reply : result.reply;

    const diff = result.ok
      ? await applyExtraction({
          client,
          userId: user.id,
          messageId: context.messageId,
          extraction: result.extraction,
          knownNodes: context.nodes,
        })
      : { created: [], strengthened: [], connected: [] };

    await client.query(
      `insert into messages (user_id, conversation_id, role, content)
       values ($1, $2, 'assistant', $3)`,
      [user.id, context.conversationId, reply],
    );

    return { reply, diff };
  });

  return NextResponse.json({
    conversationId: context.conversationId,
    reply: outcome.reply,
    diff: outcome.diff,
    safetyFlag: result.ok
      ? result.extraction.safety_flag
      : result.reason === "refusal"
        ? "crisis"
        : "none",
  });
}
