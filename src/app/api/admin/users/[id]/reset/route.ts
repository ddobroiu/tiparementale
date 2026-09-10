import { NextResponse } from "next/server";

import { resetMap } from "@/lib/account/reset-map";
import { getAdminUser } from "@/lib/admin";
import { withAdmin } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resetarea hărții unui utilizator de către administrator. Contul rămâne. */
export async function POST(
  _request: Request,
  context: RouteContext<"/api/admin/users/[id]/reset">,
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Doar pentru administratori." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "Identificator invalid." }, { status: 400 });
  }

  const result = await withAdmin(async (client) => {
    const { rows } = await client.query<{ email: string }>(
      "select email from users where id = $1",
      [id],
    );
    if (!rows[0]) return null;
    const removed = await resetMap(client, id);
    return { email: rows[0].email, ...removed };
  });

  if (!result) {
    return NextResponse.json({ error: "Utilizatorul nu există." }, { status: 404 });
  }

  console.info(
    `[admin] ${admin.email} a resetat harta ${result.email}: ${result.nodes} noduri, ${result.conversations} conversații`,
  );
  return NextResponse.json({ ok: true, ...result });
}
