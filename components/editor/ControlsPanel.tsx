"use client";

import { useState, type Dispatch } from "react";
import type { EditorAction } from "@/lib/editor-reducer";
import {
  CURATED_FONT_FAMILIES,
  FONT_META,
  type CuratedFontFamily,
  type ScaleConfig,
} from "@/lib/scale";
import { FONT_CSS_VARS } from "@/lib/fonts";

export interface ControlsPanelProps {
  config: ScaleConfig;
  // The page above this component keeps track of the scale's settings —
  // this just sends changes up to it.
  dispatch: Dispatch<EditorAction>;
}

// A plain, understated look for the input boxes, so they don't compete
// with the frosted-glass card they sit inside.
const FIELD_CLASS =
  "rounded-sm border border-border bg-surface/60 px-2.5 py-1.5 text-sm transition-colors focus-visible:border-accent";

export function ControlsPanel({ config, dispatch }: ControlsPanelProps) {
  // Which step's settings are currently shown at the bottom of this panel.
  const [selectedStep, setSelectedStep] = useState(0);
  // The manual tweaks for the step that's currently selected, if there are any.
  const override = config.overrides[String(selectedStep)];

  // Builds the list of steps to choose from, e.g. -2, -1, 0, 1, 2, 3.
  const stepOptions: number[] = [];
  for (let step = -config.base.stepsDown; step <= config.base.stepsUp; step++) {
    stepOptions.push(step);
  }

  return (
    <form
      // Keeps this card sized to fit its own content, rather than
      // stretching to match the height of the taller preview card beside it.
      className="surface grid w-full max-w-sm grid-cols-2 content-start gap-x-5 gap-y-5 self-center p-5 editor:self-start"
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
          className={FIELD_CLASS}
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
          className={FIELD_CLASS}
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
          className={FIELD_CLASS}
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
          className={FIELD_CLASS}
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
          className={FIELD_CLASS}
        >
          <option value="none">None</option>
          <option value="nearest-px">Nearest px</option>
          <option value="nearest-quarter-rem">Nearest quarter rem</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Heading font
        <select
          value={config.fonts.heading.family}
          onChange={(e) => {
            const family = e.target.value as CuratedFontFamily;
            dispatch({
              type: "setFont",
              role: "heading",
              font: { family, ...FONT_META[family] },
            });
          }}
          className={FIELD_CLASS}
        >
          {CURATED_FONT_FAMILIES.map((family) => (
            <option
              key={family}
              value={family}
              style={{ fontFamily: FONT_CSS_VARS[family] }}
            >
              {family}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Body font
        <select
          value={config.fonts.body.family}
          onChange={(e) => {
            const family = e.target.value as CuratedFontFamily;
            dispatch({
              type: "setFont",
              role: "body",
              font: { family, ...FONT_META[family] },
            });
          }}
          className={FIELD_CLASS}
        >
          {CURATED_FONT_FAMILIES.map((family) => (
            <option
              key={family}
              value={family}
              style={{ fontFamily: FONT_CSS_VARS[family] }}
            >
              {family}
            </option>
          ))}
        </select>
      </label>

      {/* A divider between the scale's overall settings above and the
          per-step overrides below. */}
      <hr className="col-span-2 my-0 border-border" />

      <label className="flex flex-col gap-1 text-sm">
        Step to override
        <select
          value={selectedStep}
          onChange={(e) => setSelectedStep(Number(e.target.value))}
          className={FIELD_CLASS}
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
          className={FIELD_CLASS}
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
          className={FIELD_CLASS}
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
          className={FIELD_CLASS}
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
          className={FIELD_CLASS}
        />
      </label>

      {/* Sits next to the Letter spacing field instead of on its own row,
          to save space. */}
      <button
        type="button"
        onClick={() =>
          dispatch({ type: "clearStepOverride", step: selectedStep })
        }
        className="self-end rounded-sm border border-border px-3 py-1 text-sm transition-colors hover:border-accent"
      >
        Clear override
      </button>
    </form>
  );
}
