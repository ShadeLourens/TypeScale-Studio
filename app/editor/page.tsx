"use client";

import { useMemo, useReducer } from "react";
import { editorReducer, initialEditorConfig } from "@/lib/editor-reducer";
import { resolveScale } from "@/lib/scale";
import { ControlsPanel } from "@/components/editor/ControlsPanel";
import { ScalePreview } from "@/components/editor/ScalePreview";

// The whole editor is: one reducer holding a ScaleConfig, run through the pure
// resolveScale() on every change, rendered by two dumb components. No other
// state lives here — this is the "one source of truth" the spec calls for.
export default function EditorPage() {
  const [config, dispatch] = useReducer(editorReducer, initialEditorConfig);
  // useMemo avoids recomputing the scale on renders that don't change config
  // (e.g. if this page ever gets sibling state that re-renders independently).
  const steps = useMemo(() => resolveScale(config), [config]);

  return (
    <div className="flex min-h-screen flex-col gap-6 p-6 md:flex-row">
      <ControlsPanel config={config} dispatch={dispatch} />
      <ScalePreview steps={steps} />
    </div>
  );
}
