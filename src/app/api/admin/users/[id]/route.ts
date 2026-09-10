import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { withAdmin } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ștergerea unui cont de către administrator. Tot ce ține de el — hartă,
 * conversații, portofel, plăți — pleacă odată cu rândul din `users`, prin
 * `on delete cascade`. Nu există „arhivare”: omul a cerut să dispară, sau
 * contul e gunoi; în ambele cazuri trebuie să nu mai rămână nimic.
 *
 * Administratorul nu se poate șterge pe sine de aici: ar rămâne fără
 * sesiune în mijlocul cererii, iar greșeala ar fi greu de reparat.
 */
export async function DELETE(_request: Request, context: RouteContext<"/api/admin/users/[id]">) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Doar pentru administratori." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "Identificator invalid." }, { status: 400 });
  }
  if (id === admin.id) {
    return NextResponse.json(
      { error: "Nu-ți poți șterge propriul cont de aici. Folosește Setări." },
      { status: 400 },
    );
  }

  const deleted = await withAdmin(async (client) => {
    const { rows } = await client.query<{ email: string }>(
      "delete from users where id = $1 returning email",
      [id],
    );
    return rows[0] ?? null;
  });

  if (!deleted) {
    return NextResponse.json({ error: "Utilizatorul nu există." }, { status: 404 });
  }

  console.info(`[admin] ${admin.email} a șters contul ${deleted.email} (${id})`);
  return NextResponse.json({ ok: true, email: deleted.email });
}
