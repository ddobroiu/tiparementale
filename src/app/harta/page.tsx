import { redirect } from "next/navigation";

import { MapView } from "@/components/MapView";
import type { SimilarPair } from "@/components/SimilarityPrompt";
import { getSessionUser } from "@/lib/auth";
import { getWallet } from "@/lib/billing/entitlement";
import { withUser } from "@/lib/db";
import { loadGraph } from "@/lib/graph";
import { loadLessonProgress } from "@/lib/lessons";

export default async function HartaPage(props: PageProps<"/harta">) {
  const user = await getSessionUser();
  // Cookie prezent dar mort (sesiune expirată sau ștearsă): poarta din
  // `proxy.ts` l-a lăsat să treacă, aici se oprește — cu harta ca țintă, ca
  // omul să ajungă unde voia după ce intră.
  if (!user) redirect("/intra?redirect=/harta");

  // Întoarcerea de la Stripe: confirmăm în hartă, ca omul să nu se întrebe
  // dacă plata a mers. Creditarea propriu-zisă vine din webhook, nu de aici.
  const search = await props.searchParams;
  const justPaid = search.plata === "reusita";

  const data = await withUser(user.id, async (client) => {
    const { nodes, edges } = await loadGraph(client);
    const wallet = await getWallet(client, user.id);
    const lessons = await loadLessonProgress(client);

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

    return { nodes, edges, wallet, similarPairs, lessons };
  });

  return (
    <MapView
      initialNodes={data.nodes}
      initialEdges={data.edges}
      initialSimilarPairs={data.similarPairs as SimilarPair[]}
      justPaid={justPaid}
      initialAccount={{
        sessionsLeft: data.wallet.sessionsLeft,
        transformationsLeft: data.wallet.transformationsLeft,
        lessons: data.lessons,
      }}
    />
  );
}
