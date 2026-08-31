import { createBrowserClient } from "@supabase/ssr";

/** Connects to Supabase (the database/login service) from the browser. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
