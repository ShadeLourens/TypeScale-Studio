import type { FontChoice, ScaleConfig, StepOverride } from "./scale";

export type EditorAction =
  | { type: "setBaseFontSize"; fontSize: number }
  | { type: "setRatio"; ratio: number }
  | { type: "setStepsUp"; stepsUp: number }
  | { type: "setStepsDown"; stepsDown: number }
  | { type: "setRounding"; rounding: ScaleConfig["base"]["rounding"] }
  | { type: "setFont"; role: "heading" | "body"; font: FontChoice }
  | { type: "setStepOverride"; step: number; override: StepOverride }
  | { type: "clearStepOverride"; step: number }
  | { type: "setTheme"; theme: ScaleConfig["theme"] }
  | { type: "loadConfig"; config: ScaleConfig };

export const initialEditorConfig: ScaleConfig = {
  version: 1,
  base: { fontSize: 15, ratio: 1.25, stepsUp: 5, stepsDown: 2, rounding: "none" },
  fonts: {
    heading: { family: "Inter", weights: [600], fallback: "sans-serif" },
    body: { family: "Inter", weights: [400], fallback: "sans-serif" },
  },
  overrides: {},
  theme: "dark",
};

/** Applies one change to a scale's settings and returns the updated version. */
export function editorReducer(state: ScaleConfig, action: EditorAction): ScaleConfig {
  switch (action.type) {
    case "setBaseFontSize":
      return { ...state, base: { ...state.base, fontSize: action.fontSize } };
    case "setRatio":
      return { ...state, base: { ...state.base, ratio: action.ratio } };
    case "setStepsUp":
      return { ...state, base: { ...state.base, stepsUp: action.stepsUp } };
    case "setStepsDown":
      return { ...state, base: { ...state.base, stepsDown: action.stepsDown } };
    case "setRounding":
      return { ...state, base: { ...state.base, rounding: action.rounding } };
    case "setFont":
      return { ...state, fonts: { ...state.fonts, [action.role]: action.font } };
    case "setStepOverride": {
      const key = String(action.step);
      return {
        ...state,
        overrides: { ...state.overrides, [key]: { ...(state.overrides[key] ?? {}), ...action.override } },
      };
    }
    case "clearStepOverride": {
      const nextOverrides = { ...state.overrides };
      delete nextOverrides[String(action.step)];
      return { ...state, overrides: nextOverrides };
    }
    case "setTheme":
      return { ...state, theme: action.theme };
    case "loadConfig":
      // Replaces everything at once — used to restore a scale that was
      // saved temporarily before sending someone to log in.
      return action.config;
    default:
      return state;
  }
}
