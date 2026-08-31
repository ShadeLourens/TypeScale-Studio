"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";
import { isScaleConfig } from "@/lib/url-state";

const MAX_SLUG_ATTEMPTS = 5;
const MAX_NAME_LENGTH = 200;

export type SaveScaleResult =
  | { ok: true; slug: string }
  | {
      ok: false;
      error:
        | "not-authenticated"
        | "invalid-config"
        | "slug-collision"
        | "unknown";
    };

/** Saves a scale for the signed-in user and gives it a unique link.
 * The incoming data is checked carefully here, since this can technically
 * be called by anything, not just this app's own save button. */
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
    const { error } = await supabase
      .from("scales")
      .insert({ owner_id: user.id, slug, config });
    if (!error) return { ok: true, slug };
    if (error.code !== "23505") return { ok: false, error: "unknown" }; // some other, real error
  }

  return { ok: false, error: "slug-collision" };
}

export type RenameScaleResult =
  | { ok: true }
  | {
      ok: false;
      error: "not-authenticated" | "invalid-name" | "not-found" | "unknown";
    };

export async function renameScale(
  id: string,
  name: string,
): Promise<RenameScaleResult> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > MAX_NAME_LENGTH)
    return { ok: false, error: "invalid-name" };

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, error: "not-authenticated" };

  const { data, error } = await supabase
    .from("scales")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id) // makes sure this is actually your own scale
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "unknown" };
  if (!data) return { ok: false, error: "not-found" };

  revalidatePath("/dashboard");
  return { ok: true };
}

export type DeleteScaleResult =
  | { ok: true }
  | { ok: false; error: "not-authenticated" | "not-found" | "unknown" };

export async function deleteScale(id: string): Promise<DeleteScaleResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, error: "not-authenticated" };

  const { data, error } = await supabase
    .from("scales")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "unknown" };
  if (!data) return { ok: false, error: "not-found" };

  revalidatePath("/dashboard");
  return { ok: true };
}
