import type { PoolClient } from "pg";

import type { Edge, MindNode } from "@/lib/types";

/**
 * Harta curentă, așa cum o vede utilizatorul: nodurile formate și
 * ne-arhivate, cu starea lucrului pe fiecare, și legăturile dintre ele.
 *
 * Ipotezele încă neformate (fără `formed_at`) nu apar: au o mențiune sau
 * două și așteaptă să revină în discuție. Muchiile către ele rămân în bază
 * și ies la iveală odată cu nodul.
 *
 * Starea lucrului vine din transformări: un nod cu o convingere nouă adoptată
 * e „rezolvat”, unul cu o convingere propusă sau în exersare e „în lucru”. Se
 * calculează aici, o dată, ca harta și panoul să spună același lucru.
 */
export async function loadGraph(client: PoolClient): Promise<{ nodes: MindNode[]; edges: Edge[] }> {
  const { rows: nodes } = await client.query<MindNode>(
    `select n.*,
            (select case
                      when bool_or(t.status = 'adopted') then 'resolved'
                      when bool_or(t.status in ('proposed', 'practicing')) then 'working'
                    end
               from transformations t
              where t.node_id = n.id) as work_status
       from nodes n
      where n.archived_at is null and n.formed_at is not null
      order by n.created_at`,
  );
  const { rows: edges } = await client.query<Edge>(
    `select e.*
       from edges e
       join nodes a on a.id = e.from_node
       join nodes b on b.id = e.to_node
      where a.formed_at is not null and b.formed_at is not null`,
  );
  return { nodes, edges };
}
