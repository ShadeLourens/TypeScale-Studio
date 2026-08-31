"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface ExportSheetProps {
  css: string;
  tailwind: string;
  tokens: string;
  // Anything else to show below the Copy button, inside this same card —
  // e.g. the Save button.
  children?: ReactNode;
}

type ExportTab = "css" | "tailwind" | "tokens";

// Kept as a fixed list (not just the object's keys) so the keyboard
// shortcuts below can reliably move to the next/previous/first/last tab.
const TAB_ORDER: ExportTab[] = ["css", "tailwind", "tokens"];
const TAB_LABELS: Record<ExportTab, string> = {
  css: "CSS",
  tailwind: "Tailwind",
  tokens: "JSON",
};

export function ExportSheet({
  css,
  tailwind,
  tokens,
  children,
}: ExportSheetProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>("css");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const content: Record<ExportTab, string> = { css, tailwind, tokens };
  const tabRefs = useRef<Partial<Record<ExportTab, HTMLButtonElement | null>>>(
    {},
  );

  async function handleCopy() {
    // Copying can fail (e.g. if the browser blocks it), so this is handled
    // instead of just assuming it always works.
    try {
      await navigator.clipboard.writeText(content[activeTab]);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 1500);
  }

  // Lets someone use the arrow keys, Home, and End to switch between tabs,
  // the same way tabs work on most other websites.
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
    if (!next) return;
    e.preventDefault();
    setActiveTab(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section
      aria-label="Export"
      // Sized to match the settings card on the other side of the screen,
      // and to fit its own content rather than stretching to fill the page.
      className="surface flex w-full max-w-sm flex-col gap-3 self-center p-4 editor:self-start"
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
            // Only the active tab can be reached by pressing Tab — the
            // arrow keys handle moving between the others.
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
      {children && (
        <div className="flex justify-end border-t border-border pt-3 pb-4">
          {children}
        </div>
      )}
    </section>
  );
}
