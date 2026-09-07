import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { runExtraction } from "@/lib/extraction/extract";
import { applyExtraction } from "@/lib/extraction/apply";
import type { MindNode } from "@/lib/types";

const HISTORY_LIMIT = 10;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const message: unknown = body?.message;
  const sessionId: string | null = body?.sessionId ?? null;

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Mesaj gol" }, { status: 400 });
  }

  const inputMode = body?.inputMode === "voice" ? "voice" : "text";

  // ------------------------------------------------------------ sesiunea

  let activeSessionId = sessionId;
  if (!activeSessionId) {
    const { data, error } = await supabase
      .from("sessions")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    activeSessionId = data.id;
  }

  // ------------------------------------------------- mesajul și contextul

  const { data: savedMessage, error: messageError } = await supabase
    .from("messages")
    .insert({
      user_id: user.id,
      session_id: activeSessionId,
      role: "user",
      content: message,
      input_mode: inputMode,
    })
    .select("id")
    .single();

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  const [{ data: nodes }, { data: history }] = await Promise.all([
    supabase.from("nodes").select("*").is("archived_at", null),
    supabase
      .from("messages")
      .select("role, content")
      .eq("session_id", activeSessionId)
      .neq("id", savedMessage.id)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT),
  ]);

  const knownNodes = (nodes ?? []) as MindNode[];

  // ------------------------------------------------------------ extracție

  const result = await runExtraction({
    nodes: knownNodes,
    history: (history ?? []).reverse() as Array<{
      role: "user" | "assistant";
      content: string;
    }>,
    message,
  });

  if (!result.ok) {
    await supabase.from("messages").insert({
      user_id: user.id,
      session_id: activeSessionId,
      role: "assistant",
      content: result.reply,
    });

    return NextResponse.json({
      sessionId: activeSessionId,
      reply: result.reply,
      diff: { created: [], strengthened: [], connected: [] },
      safetyFlag: result.reason === "refusal" ? "crisis" : "none",
    });
  }

  const diff = await applyExtraction({
    supabase,
    userId: user.id,
    messageId: savedMessage.id,
    extraction: result.extraction,
    knownNodes,
  });

  await supabase.from("messages").insert({
    user_id: user.id,
    session_id: activeSessionId,
    role: "assistant",
    content: result.extraction.reply,
  });

  return NextResponse.json({
    sessionId: activeSessionId,
    reply: result.extraction.reply,
    diff,
    safetyFlag: result.extraction.safety_flag,
  });
}
