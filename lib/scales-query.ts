import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isScaleConfig } from "@/lib/url-state";
import type { ScaleConfig } from "@/lib/scale";

export interface SharedScale {
  id: string;
  ownerId: string;
  name: string;
  config: ScaleConfig;
}

/** Looks up a publicly shared scale by its link. Anyone can view a shared
 * scale, so there's no login check here. `ownerId` is included so the page
 * can tell whether the person viewing it is allowed to rename it. */
export const getScaleBySlug = cache(
  async (slug: string): Promise<SharedScale | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("scales")
      .select("id, owner_id, name, config")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;

    const config: unknown = data.config;
    if (!isScaleConfig(config)) return null; // double-check the data really is a valid scale

    return {
      id: String(data.id),
      ownerId: String(data.owner_id),
      name: String(data.name),
      config,
    };
  },
);

export interface OwnedScale {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
}

/** Gets the list of scales someone has saved, for their dashboard. Keeps
 * the list light by not loading each scale's full settings — the "Open"
 * link takes you to the share page, which loads those separately.
 *
 * Returns null if something went wrong loading the list, which is
 * different from an empty list (meaning they really have no saved
 * scales). The dashboard shows a different message for each case. */
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
