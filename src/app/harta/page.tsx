import { redirect } from "next/navigation";

import { MapView } from "@/components/MapView";
import { createClient } from "@/lib/supabase/server";
import type { Edge, MindNode } from "@/lib/types";

export default async function HartaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/intra");

  const [{ data: nodes }, { data: edges }] = await Promise.all([
    supabase.from("nodes").select("*").is("archived_at", null).order("created_at"),
    supabase.from("edges").select("*"),
  ]);

  return (
    <MapView
      initialNodes={(nodes ?? []) as MindNode[]}
      initialEdges={(edges ?? []) as Edge[]}
    />
  );
}
