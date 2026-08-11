import { describe, expect, it } from "vitest";
import { resolveScale, type ScaleConfig } from "./scale";

// Default fixture: base 16, ratio 1.25 (Major Third), 2 steps down / 5 up, no overrides.
// Pass `overrides` to change just the fields a given test cares about.
function makeConfig(overrides: Partial<ScaleConfig> = {}): ScaleConfig {
  return {
    version: 1,
    base: {
      fontSize: 16,
      ratio: 1.25,
      stepsUp: 5,
      stepsDown: 2,
      rounding: "none",
    },
    fonts: {
      heading: { family: "Inter", weights: [600], fallback: "sans-serif" },
      body: { family: "Inter", weights: [400], fallback: "sans-serif" },
    },
    overrides: {},
    theme: "dark",
    ...overrides,
  };
}

describe("resolveScale", () => {
  it("returns one entry per step, ascending from -stepsDown to +stepsUp", () => {
    const result = resolveScale(makeConfig());
    expect(result.map((r) => r.step)).toEqual([-2, -1, 0, 1, 2, 3, 4, 5]);
  });

  it("step 0 equals the base font size and is labeled Base", () => {
    const result = resolveScale(makeConfig());
    const base = result.find((r) => r.step === 0)!;
    expect(base.fontSizePx).toBe(16);
    expect(base.fontSizeRem).toBe(1);
    expect(base.label).toBe("Base");
  });

  it("computes each step as fontSize * ratio^step", () => {
    const result = resolveScale(makeConfig());
    const stepTwo = result.find((r) => r.step === 2)!;
    const stepDownOne = result.find((r) => r.step === -1)!;
    expect(stepTwo.fontSizePx).toBeCloseTo(16 * 1.25 ** 2, 10);
    expect(stepDownOne.fontSizePx).toBeCloseTo(16 * 1.25 ** -1, 10);
  });

  it("labels positive and negative steps by default", () => {
    const result = resolveScale(makeConfig());
    expect(result.find((r) => r.step === 3)!.label).toBe("Step +3");
    expect(result.find((r) => r.step === -2)!.label).toBe("Step -2");
  });

  it("defaults to weight 400 with no overrides", () => {
    const result = resolveScale(makeConfig());
    expect(result.every((r) => r.weight === 400)).toBe(true);
  });

  // Steps above base are heading territory (h1-h6); base and everything
  // below it is body-sized text (paragraph copy, captions) — see the
  // comment in resolveScale for why this is the one place that rule lives.
  it("assigns the heading font above base and the body font at/below base", () => {
    const config = makeConfig({
      fonts: {
        heading: {
          family: "Playfair Display",
          weights: [600],
          fallback: "serif",
        },
        body: { family: "Roboto", weights: [400], fallback: "sans-serif" },
      },
    });
    const result = resolveScale(config);

    for (const step of result) {
      if (step.step > 0) {
        expect(step.family).toBe("Playfair Display");
        expect(step.fallback).toBe("serif");
      } else {
        expect(step.family).toBe("Roboto");
        expect(step.fallback).toBe("sans-serif");
      }
    }
  });

  // config.base.rounding controls the stored/exported value, not UI display formatting
  // (components format to 1 decimal on top of this regardless of mode — see scale.ts).
  describe("rounding modes", () => {
    it("'none' avoids float artifacts but keeps the unrounded scale", () => {
      const config = makeConfig({
        base: {
          fontSize: 16,
          ratio: 1.2,
          stepsUp: 3,
          stepsDown: 0,
          rounding: "none",
        },
      });
      const result = resolveScale(config);
      const step3 = result.find((r) => r.step === 3)!;
      // Raw math (16 * 1.2^3) produces 27.647999999999996 in floating point.
      expect(step3.fontSizePx).toBe(27.648);
      expect(Number.isFinite(step3.fontSizePx)).toBe(true);
    });

    it("'nearest-px' rounds the px value to a whole number", () => {
      const config = makeConfig({
        base: {
          fontSize: 16,
          ratio: 1.25,
          stepsUp: 2,
          stepsDown: 0,
          rounding: "nearest-px",
        },
      });
      const result = resolveScale(config);
      const step1 = result.find((r) => r.step === 1)!; // 20px exactly
      const step2 = result.find((r) => r.step === 2)!; // 25px exactly
      expect(step1.fontSizePx).toBe(20);
      expect(step2.fontSizePx).toBe(25);
      expect(Number.isInteger(step1.fontSizePx)).toBe(true);
    });

    it("'nearest-quarter-rem' rounds the rem value to the nearest 0.25", () => {
      const config = makeConfig({
        base: {
          fontSize: 16,
          ratio: 1.1,
          stepsUp: 3,
          stepsDown: 0,
          rounding: "nearest-quarter-rem",
        },
      });
      const result = resolveScale(config);
      for (const stepResult of result) {
        expect(stepResult.fontSizeRem * 4).toBeCloseTo(
          Math.round(stepResult.fontSizeRem * 4),
          10,
        );
        expect(stepResult.fontSizePx).toBeCloseTo(
          stepResult.fontSizeRem * 16,
          10,
        );
      }
    });
  });

  // StepOverride fields are all optional and keyed by step index (spec.md §2): only the
  // fields a designer actually touched are stored, everything else falls back to the
  // computed default for that step.
  describe("overrides", () => {
    it("applies weight, lineHeight, letterSpacing, and label only to the targeted step", () => {
      const config = makeConfig({
        overrides: {
          "3": {
            weight: 700,
            lineHeight: 1.1,
            letterSpacing: -0.02,
            label: "Display",
          },
        },
      });
      const result = resolveScale(config);
      const overridden = result.find((r) => r.step === 3)!;
      const untouched = result.find((r) => r.step === 2)!;

      expect(overridden).toMatchObject({
        weight: 700,
        lineHeight: 1.1,
        letterSpacing: -0.02,
        label: "Display",
      });
      expect(untouched.weight).toBe(400);
      expect(untouched.label).toBe("Step +2");
    });

    it("applies a partial override, falling back to computed defaults for omitted fields", () => {
      const config = makeConfig({
        overrides: { "0": { weight: 600 } },
      });
      const base = resolveScale(config).find((r) => r.step === 0)!;
      expect(base.weight).toBe(600);
      expect(base.label).toBe("Base");
      expect(base.lineHeight).toBeGreaterThan(0);
    });

    it("survives a ratio change — the core reason overrides are stored as deltas", () => {
      const overrides = { "3": { weight: 700 } };
      const before = resolveScale(
        makeConfig({
          overrides,
          base: {
            fontSize: 16,
            ratio: 1.25,
            stepsUp: 5,
            stepsDown: 2,
            rounding: "none",
          },
        }),
      );
      const after = resolveScale(
        makeConfig({
          overrides,
          base: {
            fontSize: 16,
            ratio: 1.333,
            stepsUp: 5,
            stepsDown: 2,
            rounding: "none",
          },
        }),
      );

      const beforeStep3 = before.find((r) => r.step === 3)!;
      const afterStep3 = after.find((r) => r.step === 3)!;

      // The manual weight tweak survives the ratio change...
      expect(beforeStep3.weight).toBe(700);
      expect(afterStep3.weight).toBe(700);
      // ...while the computed font size still responds to the new ratio.
      expect(beforeStep3.fontSizePx).not.toBe(afterStep3.fontSizePx);
    });
  });
});
