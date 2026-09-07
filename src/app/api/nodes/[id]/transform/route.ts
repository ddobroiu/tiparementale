import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";
import { TRANSFORMATION_MODEL, generateTransformation } from "@/lib/transformation/generate";
import {
  canTransform,
  getWallet,
  recordUsage,
  spendTransformation,
} from "@/lib/billing/entitlement";
import type { MindNode, Observation, Transformation } from "@/lib/types";

/**
 * Pornește lucrul de transformare pentru o convingere confirmată: o convingere
 * nouă care să-i ia locul, plus exerciții, exemple concrete, o carte și un film.
 *
 * Numai pentru noduri confirmate. Nu recomandăm nimic pe baza unui tipar pe
 * care omul nu l-a validat.
 */
export async function POST(_request: Request, context: RouteContext<"/api/nodes/[id]/transform">) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { id } = await context.params;

  // Citim contextul și închidem tranzacția înainte de apelul la model.
  const source = await withUser(user.id, async (client) => {
    const wallet = await getWallet(client, user.id);
    const decision = canTransform(wallet);
    if (!decision.allowed) return { denied: decision };

    const { rows } = await client.query<MindNode>("select * from nodes where id = $1", [id]);
    const node = rows[0];
    if (!node) return null;

    const { rows: observations } = await client.query<Observation>(
      "select * from observations where node_id = $1 order by observed_at desc",
      [id],
    );

    const { rows: related } = await client.query<{ label: string }>(
      `select coalesce(n.user_label, n.label) as label
         from edges e
         join nodes n on n.id = case when e.from_node = $1 then e.to_node else e.from_node end
        where e.from_node = $1 or e.to_node = $1
        limit 8`,
      [id],
    );

    return { denied: null, node, observations, relatedLabels: related.map((r) => r.label) };
  });

  if (!source) {
    return NextResponse.json({ error: "Nodul nu există" }, { status: 404 });
  }

  if (source.denied) {
    return NextResponse.json(
      { error: source.denied.reason, code: source.denied.code },
      { status: 402 },
    );
  }

  if (source.node.verdict !== "confirmed" && source.node.verdict !== "edited") {
    return NextResponse.json(
      { error: "Lucrăm doar la convingerile pe care le-ai confirmat." },
      { status: 400 },
    );
  }

  const { plan, usage } = await generateTransformation({
    node: source.node,
    observations: source.observations,
    relatedLabels: source.relatedLabels,
  });

  // Costul se înregistrează chiar dacă generarea a eșuat: apelul s-a plătit.
  await withUser(user.id, (client) =>
    recordUsage(client, {
      userId: user.id,
      conversationId: null,
      kind: "transformation",
      model: TRANSFORMATION_MODEL,
      usage,
    }),
  );

  if (!plan) {
    return NextResponse.json(
      { error: "Nu am reușit să pregătesc lucrul acum. Încearcă din nou." },
      { status: 502 },
    );
  }

  const saved = await withUser(user.id, async (client) => {
    const { rows } = await client.query<Transformation>(
      `insert into transformations (user_id, node_id, new_label, rationale)
       values ($1, $2, $3, $4)
       returning *`,
      [user.id, id, plan.new_belief, plan.rationale],
    );

    const transformation = rows[0];

    const entries = [
      ...plan.exercises.map((e) => ({
        kind: "exercise" as const,
        title: e.title,
        creator: null as string | null,
        year: null as number | null,
        rationale: e.rationale,
      })),
      ...plan.examples.map((e) => ({
        kind: "example" as const,
        title: e.title,
        creator: null,
        year: null,
        rationale: e.rationale,
      })),
      {
        kind: "book" as const,
        title: plan.book.title,
        creator: plan.book.creator,
        year: plan.book.year,
        rationale: plan.book.rationale,
      },
      {
        kind: "film" as const,
        title: plan.film.title,
        creator: plan.film.creator,
        year: plan.film.year,
        rationale: plan.film.rationale,
      },
    ];

    for (const entry of entries) {
      await client.query(
        `insert into recommendations
           (user_id, node_id, transformation_id, kind, title, creator, year, rationale)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          user.id,
          id,
          transformation.id,
          entry.kind,
          entry.title,
          entry.creator,
          entry.year,
          entry.rationale,
        ],
      );
    }

    await spendTransformation(client, user.id);

    return transformation;
  });

  return NextResponse.json({
    transformation: saved,
    whyOldPersists: plan.why_old_persists,
  });
}
