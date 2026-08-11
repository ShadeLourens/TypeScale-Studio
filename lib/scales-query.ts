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
export const getScaleBySlug = cache(
  async (slug: string): Promise<SharedScale | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("scales")
      .select("name, config")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;

    const config: unknown = data.config;
    if (!isScaleConfig(config)) return null; // defensive re-check on a row read back from the database

    return { name: String(data.name), config };
  },
);

export interface OwnedScale {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
}

/** Lightweight list for the dashboard — deliberately does NOT select `config`
 * (jsonb), which every row would otherwise carry just to be unused in the
 * list view. "Open" links to /s/[slug] instead of directly into the editor,
 * reusing the share page's own "Open in editor" link rather than re-fetching
 * full configs here.
 *
 * Returns null on a genuine fetch error, distinct from an empty array (a
 * real "you have zero scales") — collapsing both into [] would show a user
 * with saved scales a false "No scales yet" empty state during a transient
 * DB failure. The dashboard page renders these two cases differently. */
export const getScalesByOwner = cache(
  async (ownerId: string): Promise<OwnedScale[] | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("scales")
      .select("id, name, slug, updated_at")
      .eq("owner_id", ownerId)
      .order("updated_at", { ascending: false });
    if (error || !data) return null;

    return data.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      updatedAt: String(row.updated_at),
    }));
  },
);
