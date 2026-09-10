import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";
import { getGuide } from "@/lib/guides";

interface MessageRow extends Record<string, unknown> {
  role: "user" | "assistant";
  content: string;
  options: string[] | null;
}

/**
 * O conversație, cu mesajele ei: ca o lecție începută să poată fi reluată
 * de unde a rămas, nu pornită din nou.
 */
export async function GET(_request: Request, context: RouteContext<"/api/conversations/[id]">) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { id } = await context.params;

  const data = await withUser(user.id, async (client) => {
    const { rows } = await client.query<{
      id: string;
      guide_id: string | null;
      turns: number;
      step_index: number;
      closed_at: string | null;
    }>(
      "select id, guide_id, turns, step_index, closed_at from conversations where id = $1",
      [id],
    );
    if (!rows[0]) return null;

    const { rows: messages } = await client.query<MessageRow>(
      "select role, content, options from messages where conversation_id = $1 order by created_at",
      [id],
    );
    return { conversation: rows[0], messages };
  });

  if (!data) {
    return NextResponse.json({ error: "Conversația nu există." }, { status: 404 });
  }

  const guide = data.conversation.guide_id ? getGuide(data.conversation.guide_id) : null;

  return NextResponse.json({
    conversationId: data.conversation.id,
    guideId: data.conversation.guide_id,
    guideTitle: guide?.title ?? null,
    turns: data.conversation.turns,
    stepIndex: data.conversation.step_index,
    closed: data.conversation.closed_at !== null,
    messages: data.messages,
  });
}
