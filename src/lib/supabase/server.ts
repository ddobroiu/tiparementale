import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pentru Server Components și Route Handlers.
 * `cookies()` este asincron începând cu Next.js 16.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Apelat dintr-un Server Component: sesiunea este reîmprospătată
            // de proxy.ts, deci ignorarea este sigură.
          }
        },
      },
    },
  );
}

/** Utilizatorul curent, sau null. Toate interogările trec oricum prin RLS. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
