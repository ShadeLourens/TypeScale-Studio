"use client";

import { useState } from "react";

export interface ExportSheetProps {
  css: string;
  tailwind: string;
  tokens: string;
}

type ExportTab = "css" | "tailwind" | "tokens";

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

  return (
    <section
      aria-label="Export"
      className="flex w-full max-w-xl flex-col gap-3 p-4"
    >
      <div className="flex gap-2" role="tablist">
        {(Object.keys(TAB_LABELS) as ExportTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded border px-3 py-1.5 text-sm ${
              activeTab === tab
                ? "border-gray-900 font-semibold"
                : "border-gray-300"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      <pre className="max-h-96 overflow-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs">
        <code>{content[activeTab]}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="self-start rounded border border-gray-300 px-3 py-1.5 text-sm"
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
