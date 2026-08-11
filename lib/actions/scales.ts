"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";
import { isScaleConfig } from "@/lib/url-state";

const MAX_SLUG_ATTEMPTS = 5;

export type SaveScaleResult =
  | { ok: true; slug: string }
  | { ok: false; error: "not-authenticated" | "invalid-config" | "slug-collision" | "unknown" };

/** Saves a scale for the current user, generating a unique slug server-side.
 * `config` is typed unknown and validated here — Server Actions are public
 * POST endpoints reachable independent of the UI that calls them, so this
 * gets the same "never trust it" treatment URL input already gets. */
export async function saveScale(config: unknown): Promise<SaveScaleResult> {
  if (!isScaleConfig(config)) return { ok: false, error: "invalid-config" };

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, error: "not-authenticated" };

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = generateSlug();
    const { error } = await supabase.from("scales").insert({ owner_id: user.id, slug, config });
    if (!error) return { ok: true, slug };
    if (error.code !== "23505") return { ok: false, error: "unknown" }; // not a slug collision — real failure
  }

  return { ok: false, error: "slug-collision" };
}
