import { redirect } from "next/navigation";

import { MapView } from "@/components/MapView";
import { getSessionUser } from "@/lib/auth";
import { getEntitlement } from "@/lib/billing/entitlement";
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
    const entitlement = await getEntitlement(client, user.id);
    return { nodes, edges, entitlement };
  });

  return (
    <MapView
      initialNodes={data.nodes}
      initialEdges={data.edges}
      initialAccount={{
        planName: data.entitlement.planName,
        sessionsIncluded: data.entitlement.sessionsIncluded,
        sessionsLeft: Math.max(
          0,
          data.entitlement.sessionsIncluded - data.entitlement.sessionsUsed,
        ),
      }}
    />
  );
}
