"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { renameScale, deleteScale } from "@/lib/actions/scales";
import type { OwnedScale } from "@/lib/scales-query";

export interface ScaleRowProps {
  scale: OwnedScale;
}

type Mode = "idle" | "renaming" | "deleting";

// Fixed locale + UTC timezone: this renders in a client component after
// server-rendering the same markup, so an implicit/browser-detected locale
// or timezone would diverge between server and client and trigger a React
// hydration-mismatch warning on this cell. Explicit settings make the output
// identical on both sides regardless of where each render actually happens.
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

// Flat buttons, not glass — the row itself stays a plain table row too (a
// translucent/blurred <tr> fights native table rendering, per the
// milestone-6 plan). transition-colors + hover:border-accent is this
// component's share of the motion pass.
const BTN_CLASS =
  "rounded-sm border border-border px-2 py-1 transition-colors hover:border-accent";

export function ScaleRow({ scale }: ScaleRowProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [nameDraft, setNameDraft] = useState(scale.name);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Session can expire while the dashboard is just sitting open — without
  // this, a rename/delete after that point would fail forever with a
  // "try again" message that can never succeed. Matches SaveButton's
  // existing not-authenticated -> redirect-to-login handling for consistency.
  function handleNotAuthenticated() {
    router.push("/login?redirect=/dashboard");
  }

  async function handleRenameSubmit() {
    const trimmed = nameDraft.trim();
    if (!trimmed || isPending) return;
    setIsPending(true);
    setErrorMessage(null);
    const result = await renameScale(scale.id, trimmed);
    setIsPending(false);
    if (result.ok) {
      setMode("idle"); // revalidatePath inside the action refreshes this
      // row's server data on the next render — no router.refresh() needed.
    } else if (result.error === "not-authenticated") {
      handleNotAuthenticated();
    } else {
      setErrorMessage("Rename failed — try again.");
    }
  }

  async function handleDelete() {
    if (isPending) return;
    setIsPending(true);
    setErrorMessage(null);
    const result = await deleteScale(scale.id);
    if (!result.ok) {
      setIsPending(false);
      if (result.error === "not-authenticated") {
        handleNotAuthenticated();
      } else {
        setErrorMessage("Delete failed — try again.");
        setMode("idle");
      }
    }
    // On success the row disappears via revalidatePath, no local removal needed.
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/s/${scale.slug}`,
      );
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 1500);
  }

  return (
    <tr className="motion-safe:animate-fade-in border-b border-border">
      <td className="py-2">
        {mode === "renaming" ? (
          <input
            autoFocus
            aria-label="Rename scale"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleRenameSubmit();
              if (e.key === "Escape") {
                setNameDraft(scale.name);
                setMode("idle");
              }
            }}
            className="rounded-sm border border-border bg-surface/60 px-2 py-1 transition-colors focus-visible:border-accent"
          />
        ) : (
          scale.name
        )}
      </td>
      <td className="py-2 text-muted-foreground">
        {DATE_FORMATTER.format(new Date(scale.updatedAt))}
      </td>
      <td className="flex flex-wrap gap-2 py-2">
        <Link href={`/s/${scale.slug}`} className={BTN_CLASS}>
          Open
        </Link>
        <button type="button" onClick={handleCopyLink} className={BTN_CLASS}>
          {copyState === "copied"
            ? "Copied!"
            : copyState === "failed"
              ? "Copy failed"
              : "Copy link"}
        </button>
        {mode === "renaming" ? (
          <button
            type="button"
            onClick={handleRenameSubmit}
            disabled={isPending}
            className={BTN_CLASS}
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode("renaming")}
            className={BTN_CLASS}
          >
            Rename
          </button>
        )}
        {mode === "deleting" ? (
          <>
            <span className="text-xs text-muted-foreground">
              Delete this scale?
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-sm border border-red-600 px-2 py-1 text-red-600 transition-colors hover:bg-red-600/10"
            >
              {isPending ? "Deleting…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              disabled={isPending}
              className={BTN_CLASS}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setMode("deleting")}
            className={BTN_CLASS}
          >
            Delete
          </button>
        )}
        {errorMessage && (
          <span className="text-xs text-red-600">{errorMessage}</span>
        )}
      </td>
    </tr>
  );
}
