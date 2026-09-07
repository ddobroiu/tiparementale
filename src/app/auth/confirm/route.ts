import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/** Ținta linkului trimis pe email: schimbă token-ul pe o sesiune. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/harta";

  if (!tokenHash || !type) {
    redirect("/intra?eroare=link-invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    redirect("/intra?eroare=link-expirat");
  }

  redirect(next);
}
