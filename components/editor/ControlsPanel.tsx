"use client";

import { useState, type Dispatch } from "react";
import type { EditorAction } from "@/lib/editor-reducer";
import type { ScaleConfig } from "@/lib/scale";

export interface ControlsPanelProps {
  config: ScaleConfig;
  // Dispatch is passed in rather than owning a reducer here, so the parent
  // page stays the single source of truth (see app/editor/page.tsx).
  dispatch: Dispatch<EditorAction>;
}

// "use client" (top of file) because of the useState below — unlike
// ScalePreview, this component is editor-only and has no future server-render
// use case, so there's no reason to avoid client state here.
export function ControlsPanel({ config, dispatch }: ControlsPanelProps) {
  // Which step's override fields are currently shown below. Deliberately
  // local, not lifted to the page or shared with ScalePreview — nothing else
  // needs to know which step is selected yet.
  const [selectedStep, setSelectedStep] = useState(0);
  // config.overrides is keyed by String(step) and every field is optional —
  // `override` is undefined whenever the selected step has no overrides yet.
  const override = config.overrides[String(selectedStep)];

  // -stepsDown..+stepsUp inclusive — same range resolveScale() iterates over.
  const stepOptions: number[] = [];
  for (let step = -config.base.stepsDown; step <= config.base.stepsUp; step++) {
    stepOptions.push(step);
  }

  return (
    <form
      className="flex w-full max-w-xs flex-col gap-4"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="flex flex-col gap-1 text-sm">
        Base font size (px)
        <input
          type="number"
          min={12}
          max={24}
          value={config.base.fontSize}
          onChange={(e) =>
            dispatch({
              type: "setBaseFontSize",
              fontSize: Number(e.target.value),
            })
          }
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Ratio
        <input
          type="number"
          step={0.001}
          min={1}
          value={config.base.ratio}
          onChange={(e) =>
            dispatch({ type: "setRatio", ratio: Number(e.target.value) })
          }
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Steps up
        <input
          type="number"
          min={0}
          max={8}
          value={config.base.stepsUp}
          onChange={(e) =>
            dispatch({ type: "setStepsUp", stepsUp: Number(e.target.value) })
          }
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Steps down
        <input
          type="number"
          min={0}
          max={3}
          value={config.base.stepsDown}
          onChange={(e) =>
            dispatch({
              type: "setStepsDown",
              stepsDown: Number(e.target.value),
            })
          }
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Rounding
        <select
          value={config.base.rounding}
          onChange={(e) =>
            dispatch({
              type: "setRounding",
              rounding: e.target.value as ScaleConfig["base"]["rounding"],
            })
          }
        >
          <option value="none">None</option>
          <option value="nearest-px">Nearest px</option>
          <option value="nearest-quarter-rem">Nearest quarter rem</option>
        </select>
      </label>

      <hr className="border-gray-200" />

      <label className="flex flex-col gap-1 text-sm">
        Step to override
        <select
          value={selectedStep}
          onChange={(e) => setSelectedStep(Number(e.target.value))}
        >
          {stepOptions.map((step) => (
            <option key={step} value={step}>
              {step === 0
                ? "Base"
                : step > 0
                  ? `Step +${step}`
                  : `Step ${step}`}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Label
        <input
          type="text"
          value={override?.label ?? ""}
          onChange={(e) =>
            dispatch({
              type: "setStepOverride",
              step: selectedStep,
              override: { label: e.target.value },
            })
          }
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Weight
        <input
          type="number"
          value={override?.weight ?? ""}
          onChange={(e) =>
            dispatch({
              type: "setStepOverride",
              step: selectedStep,
              override: { weight: Number(e.target.value) },
            })
          }
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Line height
        <input
          type="number"
          step={0.1}
          value={override?.lineHeight ?? ""}
          onChange={(e) =>
            dispatch({
              type: "setStepOverride",
              step: selectedStep,
              override: { lineHeight: Number(e.target.value) },
            })
          }
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Letter spacing (em)
        <input
          type="number"
          step={0.01}
          value={override?.letterSpacing ?? ""}
          onChange={(e) =>
            dispatch({
              type: "setStepOverride",
              step: selectedStep,
              override: { letterSpacing: Number(e.target.value) },
            })
          }
        />
      </label>

      <button
        type="button"
        onClick={() =>
          dispatch({ type: "clearStepOverride", step: selectedStep })
        }
        className="rounded border border-gray-300 px-3 py-1.5 text-sm"
      >
        Clear override
      </button>
    </form>
  );
}
