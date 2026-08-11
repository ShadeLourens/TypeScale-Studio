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
    <tr className="border-b border-gray-100">
      <td className="py-2">
        {mode === "renaming" ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleRenameSubmit();
              if (e.key === "Escape") {
                setNameDraft(scale.name);
                setMode("idle");
              }
            }}
            className="rounded border border-gray-300 px-2 py-1"
          />
        ) : (
          scale.name
        )}
      </td>
      <td className="py-2 text-gray-500">
        {DATE_FORMATTER.format(new Date(scale.updatedAt))}
      </td>
      <td className="flex flex-wrap gap-2 py-2">
        <Link
          href={`/s/${scale.slug}`}
          className="rounded border border-gray-300 px-2 py-1"
        >
          Open
        </Link>
        <button
          type="button"
          onClick={handleCopyLink}
          className="rounded border border-gray-300 px-2 py-1"
        >
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
            className="rounded border border-gray-300 px-2 py-1"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode("renaming")}
            className="rounded border border-gray-300 px-2 py-1"
          >
            Rename
          </button>
        )}
        {mode === "deleting" ? (
          <>
            <span className="text-xs text-gray-600">Delete this scale?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded border border-red-600 px-2 py-1 text-red-600"
            >
              {isPending ? "Deleting…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              disabled={isPending}
              className="rounded border border-gray-300 px-2 py-1"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setMode("deleting")}
            className="rounded border border-gray-300 px-2 py-1"
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
