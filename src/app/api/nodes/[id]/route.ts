import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { NodeVerdict } from "@/lib/types";

const VERDICTS: NodeVerdict[] = ["unconfirmed", "confirmed", "rejected", "edited"];

/** Nodul cu tot ce îl susține: citatele și evoluția lui în timp. */
export async function GET(_request: Request, context: RouteContext<"/api/nodes/[id]">) {
  const { id } = await context.params;
  const supabase = await createClient();

  const [{ data: node }, { data: observations }, { data: history }, { data: recommendations }] =
    await Promise.all([
      supabase.from("nodes").select("*").eq("id", id).single(),
      supabase
        .from("observations")
        .select("*")
        .eq("node_id", id)
        .order("observed_at", { ascending: false }),
      supabase
        .from("node_history")
        .select("*")
        .eq("node_id", id)
        .order("changed_at", { ascending: false }),
      supabase
        .from("recommendations")
        .select("*")
        .eq("node_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (!node) {
    return NextResponse.json({ error: "Nodul nu există" }, { status: 404 });
  }

  return NextResponse.json({
    node,
    observations: observations ?? [],
    history: history ?? [],
    recommendations: recommendations ?? [],
  });
}

/**
 * Verdictul utilizatorului. Aceasta este bucla care face harta precisă:
 * ce confirmă devine adevăr în promptul următor, ce respinge devine exemplu
 * negativ.
 */
export async function PATCH(request: Request, context: RouteContext<"/api/nodes/[id]">) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const verdict: unknown = body?.verdict;
  const userLabel: unknown = body?.user_label;

  const { data: existing } = await supabase.from("nodes").select("*").eq("id", id).single();
  if (!existing) {
    return NextResponse.json({ error: "Nodul nu există" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};

  if (typeof verdict === "string" && VERDICTS.includes(verdict as NodeVerdict)) {
    update.verdict = verdict;
    // Un nod respins nu se șterge: iese din hartă, rămâne ca semnal.
    update.archived_at = verdict === "rejected" ? new Date().toISOString() : null;
  }

  if (typeof userLabel === "string" && userLabel.trim().length > 0) {
    update.user_label = userLabel.trim();
    update.verdict = "edited";
    update.archived_at = null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nimic de actualizat" }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("nodes")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const changes = [];
  if (update.verdict && update.verdict !== existing.verdict) {
    changes.push({
      node_id: id,
      user_id: user.id,
      field: "verdict",
      old_value: existing.verdict,
      new_value: String(update.verdict),
    });
  }
  if (update.user_label && update.user_label !== existing.user_label) {
    changes.push({
      node_id: id,
      user_id: user.id,
      field: "user_label",
      old_value: existing.user_label ?? existing.label,
      new_value: String(update.user_label),
    });
  }
  if (changes.length > 0) {
    await supabase.from("node_history").insert(changes);
  }

  return NextResponse.json({ node: updated });
}
