import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** Harta curentă. Nodurile respinse rămân în bază, dar ies din vizualizare. */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const [{ data: nodes }, { data: edges }] = await Promise.all([
    supabase.from("nodes").select("*").is("archived_at", null).order("created_at"),
    supabase.from("edges").select("*"),
  ]);

  return NextResponse.json({ nodes: nodes ?? [], edges: edges ?? [] });
}
