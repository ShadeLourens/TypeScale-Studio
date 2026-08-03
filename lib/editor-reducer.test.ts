import { describe, expect, it } from "vitest";
import { editorReducer, initialEditorConfig, type EditorAction } from "./editor-reducer";
import { resolveScale } from "./scale";

describe("editorReducer", () => {
  it("setBaseFontSize updates only fontSize", () => {
    const next = editorReducer(initialEditorConfig, { type: "setBaseFontSize", fontSize: 18 });
    expect(next.base.fontSize).toBe(18);
    expect(next.base.ratio).toBe(initialEditorConfig.base.ratio);
  });

  it("setRatio updates only ratio", () => {
    const next = editorReducer(initialEditorConfig, { type: "setRatio", ratio: 1.5 });
    expect(next.base.ratio).toBe(1.5);
    expect(next.base.fontSize).toBe(initialEditorConfig.base.fontSize);
  });

  it("setStepsUp and setStepsDown update only their field", () => {
    const up = editorReducer(initialEditorConfig, { type: "setStepsUp", stepsUp: 7 });
    expect(up.base.stepsUp).toBe(7);
    expect(up.base.stepsDown).toBe(initialEditorConfig.base.stepsDown);

    const down = editorReducer(initialEditorConfig, { type: "setStepsDown", stepsDown: 3 });
    expect(down.base.stepsDown).toBe(3);
    expect(down.base.stepsUp).toBe(initialEditorConfig.base.stepsUp);
  });

  it("setRounding updates only rounding", () => {
    const next = editorReducer(initialEditorConfig, { type: "setRounding", rounding: "nearest-px" });
    expect(next.base.rounding).toBe("nearest-px");
    expect(next.base.fontSize).toBe(initialEditorConfig.base.fontSize);
  });

  it("setFont replaces only the targeted role", () => {
    const newHeadingFont = { family: "Lora", weights: [500, 700], fallback: "serif" as const };
    const next = editorReducer(initialEditorConfig, { type: "setFont", role: "heading", font: newHeadingFont });
    expect(next.fonts.heading).toEqual(newHeadingFont);
    expect(next.fonts.body).toEqual(initialEditorConfig.fonts.body);
  });

  it("setTheme updates only theme", () => {
    const next = editorReducer(initialEditorConfig, { type: "setTheme", theme: "light" });
    expect(next.theme).toBe("light");
    expect(next.base).toEqual(initialEditorConfig.base);
  });

  describe("step overrides", () => {
    it("setStepOverride creates an override with just the given fields when none existed", () => {
      const next = editorReducer(initialEditorConfig, {
        type: "setStepOverride",
        step: 3,
        override: { weight: 700 },
      });
      expect(next.overrides["3"]).toEqual({ weight: 700 });
      expect(next.overrides["2"]).toBeUndefined();
    });

    it("setStepOverride merges onto an existing override rather than replacing it", () => {
      const withLabel = editorReducer(initialEditorConfig, {
        type: "setStepOverride",
        step: 3,
        override: { label: "Display" },
      });
      const withWeightToo = editorReducer(withLabel, {
        type: "setStepOverride",
        step: 3,
        override: { weight: 700 },
      });
      expect(withWeightToo.overrides["3"]).toEqual({ label: "Display", weight: 700 });
    });

    it("clearStepOverride removes only that step's key", () => {
      const withTwoOverrides = editorReducer(
        editorReducer(initialEditorConfig, { type: "setStepOverride", step: 3, override: { weight: 700 } }),
        { type: "setStepOverride", step: -1, override: { label: "Caption" } }
      );
      const cleared = editorReducer(withTwoOverrides, { type: "clearStepOverride", step: 3 });
      expect(cleared.overrides["3"]).toBeUndefined();
      expect(cleared.overrides["-1"]).toEqual({ label: "Caption" });
    });
  });

  it("returns the same object reference for an unrecognized action", () => {
    const unknownAction = { type: "noSuchAction" } as unknown as EditorAction;
    expect(editorReducer(initialEditorConfig, unknownAction)).toBe(initialEditorConfig);
  });

  it("initialEditorConfig resolves cleanly through resolveScale", () => {
    const steps = resolveScale(initialEditorConfig);
    expect(steps).toHaveLength(initialEditorConfig.base.stepsUp + initialEditorConfig.base.stepsDown + 1);
  });
});
