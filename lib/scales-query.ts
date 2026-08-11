import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isScaleConfig } from "@/lib/url-state";
import type { ScaleConfig } from "@/lib/scale";

export interface SharedScale {
  name: string;
  config: ScaleConfig;
}

/** Fetches a public scale by slug. Relies entirely on the `is_public = true`
 * RLS policy — no auth check needed, works for a logged-out visitor.
 * cache()'d so generateMetadata and the page body share one fetch per request. */
export const getScaleBySlug = cache(async (slug: string): Promise<SharedScale | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("scales").select("name, config").eq("slug", slug).maybeSingle();
  if (error || !data) return null;

  const config: unknown = data.config;
  if (!isScaleConfig(config)) return null; // defensive re-check on a row read back from the database

  return { name: String(data.name), config };
});
