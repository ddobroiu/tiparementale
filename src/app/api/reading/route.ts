import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { recordUsage } from "@/lib/billing/entitlement";
import { withUser } from "@/lib/db";
import { READING_MODEL, generateReading } from "@/lib/reading/generate";
import { describeAiError } from "@/lib/ai-error";
import type { Edge, MindNode } from "@/lib/types";

/** Sub acest prag, o citire de ansamblu ar fabrica semnificații. */
const MIN_NODES = 5;

interface ReadingRow extends Record<string, unknown> {
  id: string;
  summary: string;
  themes: unknown;
  node_count: number;
  created_at: string;
}

/** Ultima citire, dacă există. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const data = await withUser(user.id, async (client) => {
    const { rows } = await client.query<ReadingRow>(
      "select * from map_readings order by created_at desc limit 1",
    );

    const { rows: counts } = await client.query<{ n: string }>(
      "select count(*) as n from nodes where archived_at is null and formed_at is not null",
    );

    return { latest: rows[0] ?? null, nodeCount: Number(counts[0].n) };
  });

  return NextResponse.json({
    reading: data.latest,
    nodeCount: data.nodeCount,
    minNodes: MIN_NODES,
    // O citire făcută pe o hartă mult mai mică decât cea de acum e depășită.
    stale: data.latest ? data.nodeCount > data.latest.node_count + 3 : false,
  });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const source = await withUser(user.id, async (client) => {
    const { rows: nodes } = await client.query<MindNode>(
      "select * from nodes where archived_at is null and formed_at is not null order by confidence desc",
    );
    const { rows: edges } = await client.query<Edge>("select * from edges");
    const { rows: previous } = await client.query<{
      summary: string;
      created_at: string;
    }>("select summary, created_at from map_readings order by created_at desc limit 1");

    return { nodes, edges, previous: previous[0] ?? null };
  });

  if (source.nodes.length < MIN_NODES) {
    return NextResponse.json(
      {
        error:
          "Harta e încă prea mică pentru o citire de ansamblu. Mai vorbim o " +
          "dată și revenim.",
      },
      { status: 400 },
    );
  }

  let generated;
  try {
    generated = await generateReading(source);
  } catch (error) {
    const failure = describeAiError(error, "reading");
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }

  const { reading, usage } = generated;

  const saved = await withUser(user.id, async (client) => {
    await recordUsage(client, {
      userId: user.id,
      conversationId: null,
      kind: "extraction",
      model: READING_MODEL,
      usage,
    });

    if (!reading) return null;

    const { rows } = await client.query<ReadingRow>(
      `insert into map_readings (user_id, summary, themes, node_count)
       values ($1, $2, $3, $4)
       returning *`,
      [
        user.id,
        reading.summary,
        JSON.stringify({
          themes: reading.themes,
          tension: reading.tension,
          blind_spot: reading.blind_spot,
        }),
        source.nodes.length,
      ],
    );

    return rows[0];
  });

  if (!saved) {
    return NextResponse.json(
      { error: "Nu am reușit să citesc harta acum. Încearcă din nou." },
      { status: 502 },
    );
  }

  return NextResponse.json({ reading: saved });
}
