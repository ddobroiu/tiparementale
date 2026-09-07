import { redirect } from "next/navigation";

import { MapView } from "@/components/MapView";
import type { SimilarPair } from "@/components/SimilarityPrompt";
import { getSessionUser } from "@/lib/auth";
import { getWallet } from "@/lib/billing/entitlement";
import { withUser } from "@/lib/db";
import type { Edge, MindNode } from "@/lib/types";

export default async function HartaPage() {
  const user = await getSessionUser();
  if (!user) redirect("/intra");

  const data = await withUser(user.id, async (client) => {
    const { rows: nodes } = await client.query<MindNode>(
      "select * from nodes where archived_at is null order by created_at",
    );
    const { rows: edges } = await client.query<Edge>("select * from edges");
    const wallet = await getWallet(client, user.id);

    const { rows: similarPairs } = await client.query(
      `select s.id, s.score,
              a.id as a_id, coalesce(a.user_label, a.label) as a_label,
              b.id as b_id, coalesce(b.user_label, b.label) as b_label
         from node_similarities s
         join nodes a on a.id = s.node_a
         join nodes b on b.id = s.node_b
        where s.status = 'pending'
          and a.archived_at is null and b.archived_at is null
        order by s.score desc
        limit 5`,
    );

    return { nodes, edges, wallet, similarPairs };
  });

  return (
    <MapView
      initialNodes={data.nodes}
      initialEdges={data.edges}
      initialSimilarPairs={data.similarPairs as SimilarPair[]}
      initialAccount={{
        sessionsLeft: data.wallet.sessionsLeft,
        transformationsLeft: data.wallet.transformationsLeft,
      }}
    />
  );
}
