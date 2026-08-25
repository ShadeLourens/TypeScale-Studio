"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveScale } from "@/lib/actions/scales";
import { SAVE_STASH_KEY, serializePendingSave } from "@/lib/save-stash";
import type { ScaleConfig } from "@/lib/scale";

export interface SaveButtonProps {
  config: ScaleConfig;
}

// The server is the single source of truth for "are you logged in": this
// always tries saveScale first rather than pre-checking auth state client
// side, which avoids a client/server auth-state race (e.g. a session that
// just expired but the client doesn't know yet).
export function SaveButton({ config }: SaveButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function handleSave() {
    setStatus("saving");
    const result = await saveScale(config);

    if (result.ok) {
      router.push(`/s/${result.slug}`);
      return;
    }

    if (result.error === "not-authenticated") {
      sessionStorage.setItem(SAVE_STASH_KEY, serializePendingSave(config));
      router.push("/login?redirect=/editor");
      return;
    }

    setStatus("error");
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={status === "saving"}
      className="rounded-sm border border-border px-3 py-1.5 text-sm transition-colors hover:border-accent"
    >
      {status === "saving" ? "Saving…" : status === "error" ? "Save failed — retry" : "Save scale"}
    </button>
  );
}
