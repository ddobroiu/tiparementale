import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";
import { SCHEMA_BY_CODE } from "@/lib/schemas";
import {
  EXPLORABLE_DOMAINS,
  NODE_TYPE_LABELS,
  type LifeDomain,
  type MindNode,
  type NodeType,
} from "@/lib/types";

/**
 * Omul adaugă singur un element pe hartă.
 *
 * Nu tot ce știe cineva despre sine trebuie să iasă dintr-o conversație. Cine
 * își cunoaște deja o frică sau un tipar o poate pune direct — și, fiind
 * formulată de el, intră ca *confirmată*, cu propriile cuvinte drept citat.
 * Harta rămâne verificabilă: „de unde știi asta?” — „mi-ai spus-o tu, la data X”.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const type = body?.type as NodeType;
  const domain = body?.domain as LifeDomain;
  const schemaCode =
    typeof body?.schema_code === "string" && SCHEMA_BY_CODE.has(body.schema_code)
      ? body.schema_code
      : null;
  const summary = typeof body?.summary === "string" ? body.summary.trim().slice(0, 500) : null;

  if (label.length < 3 || label.length > 200) {
    return NextResponse.json(
      { error: "Formularea trebuie să aibă între 3 și 200 de caractere." },
      { status: 400 },
    );
  }
  if (!(type in NODE_TYPE_LABELS)) {
    return NextResponse.json({ error: "Tip necunoscut." }, { status: 400 });
  }
  if (!EXPLORABLE_DOMAINS.includes(domain) && domain !== "other") {
    return NextResponse.json({ error: "Zonă necunoscută." }, { status: 400 });
  }

  const node = await withUser(user.id, async (client) => {
    const { rows } = await client.query<MindNode>(
      `insert into nodes
         (user_id, type, domain, label, summary, confidence, verdict, schema_code)
       values ($1, $2, $3, $4, $5, 0.6, 'confirmed', $6)
       returning *`,
      [user.id, type, domain, label, summary || null, schemaCode],
    );
    const created = rows[0];

    // Citatul-sursă e chiar formularea lui: harta nu are elemente fără dovadă.
    await client.query(
      `insert into observations (node_id, user_id, quote, sentiment, valence)
       values ($1, $2, $3, 'adăugat de tine', 0)`,
      [created.id, user.id, label],
    );

    await client.query(
      `insert into node_history (node_id, user_id, field, old_value, new_value)
       values ($1, $2, 'adăugat', null, 'manual, de către utilizator')`,
      [created.id, user.id],
    );

    return created;
  });

  return NextResponse.json({ node });
}
