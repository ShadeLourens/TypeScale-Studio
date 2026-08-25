"use client";

import { useRef, useState, type KeyboardEvent } from "react";

export interface ExportSheetProps {
  css: string;
  tailwind: string;
  tokens: string;
}

type ExportTab = "css" | "tailwind" | "tokens";

// Explicit order, not Object.keys(TAB_LABELS) — the keyboard handler below
// needs a stable array to compute next/previous/first/last against.
const TAB_ORDER: ExportTab[] = ["css", "tailwind", "tokens"];
const TAB_LABELS: Record<ExportTab, string> = {
  css: "CSS",
  tailwind: "Tailwind",
  tokens: "JSON",
};

// "use client" for state + navigator.clipboard — unlike ScalePreview, this
// component has no future server-render use case, so there's no reason to
// avoid client state here (same reasoning as ControlsPanel).
export function ExportSheet({ css, tailwind, tokens }: ExportSheetProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>("css");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const content: Record<ExportTab, string> = { css, tailwind, tokens };
  const tabRefs = useRef<Partial<Record<ExportTab, HTMLButtonElement | null>>>(
    {},
  );

  async function handleCopy() {
    // clipboard.writeText rejects in insecure contexts or on permission
    // denial — the try/catch here is a real correctness concern, not
    // decoration, since an unhandled rejection would be a silent bug.
    try {
      await navigator.clipboard.writeText(content[activeTab]);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 1500);
  }

  // WAI-ARIA Tabs pattern, automatic-activation variant: an arrow key both
  // moves focus AND activates the tab in one step, matching this
  // component's existing click-to-activate model rather than introducing a
  // second "focus vs. select" distinction. Wraps circularly; Home/End jump
  // to the ends. role="tab"/aria-selected alone (without this) is a
  // half-applied ARIA pattern — using the roles obligates the keyboard model.
  function handleTabKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TAB_ORDER.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = TAB_ORDER.length - 1;
    }
    if (nextIndex === null) return;
    const next = TAB_ORDER[nextIndex];
    // nextIndex is always a valid TAB_ORDER index (modulo/clamped above) —
    // this check is only here to satisfy noUncheckedIndexedAccess.
    if (!next) return;
    e.preventDefault();
    setActiveTab(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section
      aria-label="Export"
      className="surface flex w-full max-w-xl flex-col gap-3 p-4"
    >
      <div className="flex gap-2" role="tablist" aria-label="Export format">
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            ref={(el) => {
              tabRefs.current[tab] = el;
            }}
            type="button"
            role="tab"
            id={`export-tab-${tab}`}
            aria-controls="export-tabpanel"
            aria-selected={activeTab === tab}
            // Roving tabindex: only the active tab is a Tab stop — arrow
            // keys move between the rest, per the ARIA Tabs pattern.
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            onKeyDown={handleTabKeyDown}
            className={`rounded-sm border px-3 py-1.5 text-sm transition-colors hover:border-accent ${
              activeTab === tab
                ? "border-accent font-semibold"
                : "border-border"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      <pre
        id="export-tabpanel"
        role="tabpanel"
        aria-labelledby={`export-tab-${activeTab}`}
        className="surface max-h-96 overflow-auto p-3 text-xs"
      >
        <code>{content[activeTab]}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="self-start rounded-sm border border-border px-3 py-1.5 text-sm transition-colors hover:border-accent"
      >
        {copyState === "copied"
          ? "Copied!"
          : copyState === "failed"
            ? "Copy failed"
            : "Copy"}
      </button>
    </section>
  );
}
