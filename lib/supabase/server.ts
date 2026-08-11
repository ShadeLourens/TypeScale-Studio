import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Server-side Supabase client — for Server Components, Server Actions, and Route Handlers. */
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
          // Server Components can't set cookies — this throws there, which is
          // expected and safe to ignore: the proxy (proxy.ts) refreshes the
          // session on every request, so Server Component calls never need to.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // ignore — see comment above
          }
        },
      },
    },
  );
}
