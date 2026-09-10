import { NextResponse } from "next/server";

import { RESET_WORD, resetMap } from "@/lib/account/reset-map";
import { getSessionUser } from "@/lib/auth";
import { withUser } from "@/lib/db";

/**
 * Resetarea hărții de către utilizator. Harta pleacă, contul și ședințele
 * rămân. Cere un cuvânt de confirmare — o hartă de luni de zile nu trebuie să
 * dispară dintr-un click greșit.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const confirm = typeof body?.confirm === "string" ? body.confirm.trim().toLowerCase() : "";
  if (confirm !== RESET_WORD) {
    return NextResponse.json(
      { error: `Scrie „${RESET_WORD}” ca să confirmi.` },
      { status: 400 },
    );
  }

  const removed = await withUser(user.id, (client) => resetMap(client, user.id));
  return NextResponse.json({ ok: true, ...removed });
}
