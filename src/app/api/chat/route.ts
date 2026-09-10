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
import {
  REPLY_MODEL,
  runReply,
  sanitizeOptions,
} from "@/lib/conversation/reply";
import { getGuide } from "@/lib/guides";
import { describeAiError } from "@/lib/ai-error";
import { EXTRACTION_THRESHOLD } from "@/lib/models";
import { withUser } from "@/lib/db";
import type { MindNode } from "@/lib/types";

const HISTORY_LIMIT = 12;

/** Câte replici poate ține un pas de ghid înainte să treacă mai departe. */
const MAX_TURNS_PER_STEP = 3;

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
    let guideId: string | null = null;
    let stepIndex = 0;
    let stepTurns = 0;

    if (conversationId) {
      const { rows } = await client.query<{
        id: string;
        turns: number;
        guide_id: string | null;
        step_index: number;
        step_turns: number;
      }>(
        `select id, turns, guide_id, step_index, step_turns
           from conversations where id = $1 and closed_at is null`,
        [conversationId],
      );
      if (rows.length === 0) {
        conversationId = null;
      } else {
        turns = rows[0].turns;
        guideId = rows[0].guide_id;
        stepIndex = rows[0].step_index;
        stepTurns = rows[0].step_turns;
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

    await client.query(
      "update conversations set turns = turns + 1 where id = $1",
      [conversationId],
    );

    const { rows: nodes } = await client.query<MindNode>(
      "select * from nodes where archived_at is null order by created_at",
    );

    const { rows: history } = await client.query<{
      role: "user" | "assistant";
      content: string;
    }>(
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
      guideId,
      stepIndex,
      stepTurns,
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

  let result;
  try {
    result = await runReply({
      nodes: context.nodes,
      history: context.history,
      message,
      guideId: context.guideId,
      stepIndex: context.stepIndex,
      turnsOnStep: context.stepTurns,
    });
  } catch (error) {
    // Mesajul omului a fost deja salvat, deci nu se pierde. Ședința nu se
    // consumă mai departe: replica lui rămâne neprelucrată și poate fi reluată.
    const failure = describeAiError(error, "reply");
    return NextResponse.json(
      { error: failure.message, retryable: failure.retryable },
      { status: failure.status },
    );
  }

  const safetyFlag = result.ok ? result.reply.safety_flag : result.safety;
  // Pasul avansează când modelul spune că și-a făcut treaba — sau, oricum, după
  // MAX_TURNS_PER_STEP replici. Lăsat singur, modelul sapă la nesfârșit într-un
  // pas, iar o ședință de 25 de replici ar acoperi două teme din cinci.
  const onGuide = context.guideId !== null;
  const advance =
    onGuide &&
    result.ok &&
    (result.reply.advance_step || context.stepTurns + 1 >= MAX_TURNS_PER_STEP);
  // Lecția s-a încheiat când s-a trecut de ultimul ei pas.
  const guide = context.guideId ? getGuide(context.guideId) : null;
  const guideComplete = Boolean(
    guide && advance && context.stepIndex + 1 >= guide.steps.length,
  );

  // Variantele care aparțin altui pas decât întrebarea pusă nu ajung la om.
  const cleaned = result.ok
    ? sanitizeOptions(
        result.reply.options,
        context.guideId,
        context.stepIndex,
        advance,
      )
    : [];
  let options: string[] | null = cleaned.length > 0 ? cleaned : null;

  // Modelul a livrat, rar, o replică goală: o structură validă, fără text.
  // Omului nu i se arată liniște. Pe ghid, întrebarea pasului următor e mereu
  // la îndemână; altfel, o invitație să continue.
  let reply = result.ok ? result.reply.reply.trim() : result.reply;
  if (reply.length === 0) {
    const nextStep =
      guide && advance ? guide.steps[context.stepIndex + 1] : null;
    if (nextStep) {
      reply = nextStep.question;
      options = nextStep.options ?? null;
    } else if (guideComplete) {
      reply =
        "Asta a fost lecția. Ce mi-ai povestit se așază acum pe hartă — " +
        "deschide-o ca să vezi ce a apărut și să confirmi ce e adevărat.";
      options = null;
    } else {
      reply = "Spune-mi mai mult despre asta — ce s-a întâmplat mai exact?";
    }
    console.warn(
      `[chat] replică goală de la model, înlocuită (conversația ${context.conversationId})`,
    );
  }

  const after = await withUser(user.id, async (client) => {
    // Variantele propuse se păstrează lângă replică: istoricul arată ce i s-a
    // oferit omului, nu doar ce a ales.
    await client.query(
      `insert into messages (user_id, conversation_id, role, content, options)
       values ($1, $2, 'assistant', $3, $4)`,
      [
        user.id,
        context.conversationId,
        reply,
        options ? JSON.stringify(options) : null,
      ],
    );

    if (advance) {
      await client.query(
        `update conversations set step_index = step_index + 1, step_turns = 0
          where id = $1`,
        [context.conversationId],
      );
    } else if (onGuide) {
      await client.query(
        "update conversations set step_turns = step_turns + 1 where id = $1",
        [context.conversationId],
      );
    }

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
    options,
    safetyFlag,
    domainInFocus: result.ok ? result.reply.domain_in_focus : null,
    // Harta se actualizează la pragul obișnuit, dar și la fiecare pas încheiat
    // al lecției (dacă are din ce) și, oricum, la sfârșitul ei.
    extractionDue:
      after >= EXTRACTION_THRESHOLD || (advance && after >= 3) || guideComplete,
    guideComplete,
    turnsLeft: MAX_TURNS_PER_SESSION - context.turns,
  });
}
