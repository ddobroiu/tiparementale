import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";
import { applyExtraction } from "@/lib/extraction/apply";
import { runExtraction } from "@/lib/extraction/extract";
import type { MapDiff, MindNode } from "@/lib/types";

const EMPTY_DIFF: MapDiff = { created: [], strengthened: [], connected: [] };

interface PendingMessage extends Record<string, unknown> {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/**
 * Prelucrează bucata de conversație neextrasă încă și actualizează harta.
 *
 * Pornit de client când `/api/chat` semnalează că s-au adunat destule replici,
 * și la închiderea panoului de conversație, ca nimic să nu rămână neprelucrat.
 */
export async function POST(_request: Request, context: RouteContext<"/api/conversations/[id]/extract">) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { id } = await context.params;

  const source = await withUser(user.id, async (client) => {
    const { rows: conversation } = await client.query<{ id: string }>(
      "select id from conversations where id = $1",
      [id],
    );
    if (conversation.length === 0) return null;

    const { rows: pending } = await client.query<PendingMessage>(
      `select id, role, content from messages
        where conversation_id = $1 and extracted_at is null
        order by created_at`,
      [id],
    );

    const { rows: nodes } = await client.query<MindNode>(
      "select * from nodes where archived_at is null order by created_at",
    );

    return { pending, nodes };
  });

  if (!source) {
    return NextResponse.json({ error: "Conversația nu există" }, { status: 404 });
  }

  const userMessages = source.pending.filter((m) => m.role === "user");

  if (userMessages.length === 0) {
    return NextResponse.json({ diff: EMPTY_DIFF, extracted: 0 });
  }

  const result = await runExtraction({
    nodes: source.nodes,
    exchanges: source.pending.map((m) => ({ role: m.role, content: m.content })),
  });

  // La eșec nu marcăm nimic drept prelucrat: bucata se reia data viitoare,
  // în loc să se piardă.
  if (!result.ok) {
    return NextResponse.json({ diff: EMPTY_DIFF, extracted: 0, failed: true });
  }

  const diff = await withUser(user.id, async (client) => {
    const applied = await applyExtraction({
      client,
      userId: user.id,
      sourceMessages: userMessages.map((m) => ({ id: m.id, content: m.content })),
      extraction: result.extraction,
      knownNodes: source.nodes,
    });

    await client.query(
      `update messages set extracted_at = now()
        where id = any($1::uuid[])`,
      [source.pending.map((m) => m.id)],
    );

    return applied;
  });

  return NextResponse.json({ diff, extracted: userMessages.length });
}
