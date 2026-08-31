import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Connects to Supabase (the database/login service) from server-side code. */
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
          // Some pages aren't allowed to update cookies directly, so this can
          // safely fail there — proxy.ts keeps the login session fresh instead.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // safe to ignore, see above
          }
        },
      },
    },
  );
}
