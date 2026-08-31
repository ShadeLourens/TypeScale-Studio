"use client";

import { useState } from "react";
import { renameScale } from "@/lib/actions/scales";

export interface ShareHeaderProps {
  scaleId: string;
  slug: string;
  initialName: string;
  // Only the person who saved this scale can rename it — everyone else
  // just sees the name as plain text.
  isOwner: boolean;
}

const BTN_CLASS =
  "rounded-sm border border-border px-3 py-1.5 text-sm transition-colors hover:border-accent";

// The title bar on a scale's public page: the name (editable if this is
// your own scale) plus a button anyone can use to grab the link.
export function ShareHeader({
  scaleId,
  slug,
  initialName,
  isOwner,
}: ShareHeaderProps) {
  const [name, setName] = useState(initialName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(initialName);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shareState, setShareState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  async function handleRenameSubmit() {
    const trimmed = nameDraft.trim();
    if (!trimmed || isPending) return;
    setIsPending(true);
    setErrorMessage(null);
    const result = await renameScale(scaleId, trimmed);
    setIsPending(false);
    if (result.ok) {
      setName(trimmed);
      setIsRenaming(false);
    } else {
      setErrorMessage("Rename failed — try again.");
    }
  }

  async function handleShareLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/s/${slug}`,
      );
      setShareState("copied");
    } catch {
      setShareState("failed");
    }
    setTimeout(() => setShareState("idle"), 1500);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isOwner && isRenaming ? (
        <input
          autoFocus
          aria-label="Rename scale"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleRenameSubmit();
            if (e.key === "Escape") {
              setNameDraft(name);
              setIsRenaming(false);
            }
          }}
          className="rounded-sm border border-border bg-surface/60 px-2 py-1 text-lg font-semibold transition-colors focus-visible:border-accent"
        />
      ) : (
        <h1 className="text-lg font-semibold">{name}</h1>
      )}
      {isOwner &&
        (isRenaming ? (
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
            onClick={() => {
              setNameDraft(name);
              setIsRenaming(true);
            }}
            className={BTN_CLASS}
          >
            Rename
          </button>
        ))}
      <button type="button" onClick={handleShareLink} className={BTN_CLASS}>
        {shareState === "copied"
          ? "Copied!"
          : shareState === "failed"
            ? "Copy failed"
            : "Share link"}
      </button>
      {errorMessage && (
        <span className="text-xs text-red-600">{errorMessage}</span>
      )}
    </div>
  );
}
