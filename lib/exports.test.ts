import { describe, expect, it } from "vitest";
import { toCSS, toTailwind, toTokens } from "./exports";
import { initialEditorConfig } from "./editor-reducer";
import type { ScaleConfig } from "./scale";

// A single-step config (step 0 only) keeps the exact-string assertions below
// small enough to read at a glance, while the initialEditorConfig-based
// checks confirm the real multi-step shape (negative/positive suffixes, the
// :root/@theme wrapper) without pinning down every line of a long string.
function minimalConfig(): ScaleConfig {
  return {
    ...initialEditorConfig,
    base: { ...initialEditorConfig.base, stepsUp: 0, stepsDown: 0 },
    overrides: {},
  };
}

describe("toCSS", () => {
  it("renders a :root block with size/line-height/weight/letter-spacing per step", () => {
    expect(toCSS(minimalConfig())).toBe(
      [
        ":root {",
        "  --step-0: 1rem;",
        "  --step-0-line-height: 1.5;",
        "  --step-0-weight: 400;",
        "  --step-0-letter-spacing: 0em;",
        "}",
      ].join("\n"),
    );
  });

  it("names negative and positive steps as step-down-N / step-up-N", () => {
    const css = toCSS(initialEditorConfig);
    expect(css).toContain(":root {");
    expect(css).toContain("--step-down-2:");
    expect(css).toContain("--step-up-5:");
  });
});

describe("toTailwind", () => {
  it("renders a v4 @theme block with compound line-height/letter-spacing/font-weight per step", () => {
    expect(toTailwind(minimalConfig())).toBe(
      [
        "@theme {",
        "  --text-step-0: 1rem;",
        "  --text-step-0--line-height: 1.5;",
        "  --text-step-0--letter-spacing: 0em;",
        "  --text-step-0--font-weight: 400;",
        "}",
      ].join("\n"),
    );
  });

  // Guards the naming-hazard fix: Tailwind's @theme parser reads a second "--"
  // as the start of a compound sub-property, so a signed-number suffix like
  // "--text-step--2" would risk being misparsed and silently dropped.
  it("never produces a double-dash-before-a-negative-number suffix", () => {
    const tailwind = toTailwind(initialEditorConfig);
    expect(tailwind).not.toMatch(/--text-step--\d/);
    expect(tailwind).toContain("--text-step-down-2:");
    expect(tailwind).toContain("--text-step-up-5:");
  });
});

describe("toTokens", () => {
  it("returns valid JSON with one entry per step plus base/fonts/theme passthrough", () => {
    const parsed = JSON.parse(toTokens(initialEditorConfig));
    expect(parsed.steps).toHaveLength(
      initialEditorConfig.base.stepsUp + initialEditorConfig.base.stepsDown + 1,
    );
    expect(parsed.base).toEqual({
      fontSize: initialEditorConfig.base.fontSize,
      ratio: initialEditorConfig.base.ratio,
    });
    expect(parsed.fonts).toEqual(initialEditorConfig.fonts);
    expect(parsed.theme).toBe(initialEditorConfig.theme);
  });

  it("does not echo raw config.overrides — only resolved per-step values", () => {
    const parsed = JSON.parse(toTokens(initialEditorConfig));
    expect(parsed.overrides).toBeUndefined();
  });
});

describe("overrides reflected in every export", () => {
  const config: ScaleConfig = {
    ...initialEditorConfig,
    overrides: { "3": { weight: 700, label: "Display" } },
  };

  it("toCSS reflects the overridden weight on step 3", () => {
    expect(toCSS(config)).toContain("--step-up-3-weight: 700;");
  });

  it("toTailwind reflects the overridden weight on step 3", () => {
    expect(toTailwind(config)).toContain("--text-step-up-3--font-weight: 700;");
  });

  it("toTokens reflects the overridden weight and label on step 3", () => {
    const parsed = JSON.parse(toTokens(config));
    const step3 = parsed.steps.find((s: { step: number }) => s.step === 3);
    expect(step3.weight).toBe(700);
    expect(step3.label).toBe("Display");
  });
});

// toCSS and toTailwind must name each step identically (minus their prefix),
// so switching between the two exports never requires renaming anything.
describe("naming consistency between toCSS and toTailwind", () => {
  it("uses the same step suffixes in both formats", () => {
    const css = toCSS(initialEditorConfig);
    const tailwind = toTailwind(initialEditorConfig);
    const suffixes = [
      "down-2",
      "down-1",
      "0",
      "up-1",
      "up-2",
      "up-3",
      "up-4",
      "up-5",
    ];
    for (const suffix of suffixes) {
      expect(css).toContain(`--step-${suffix}:`);
      expect(tailwind).toContain(`--text-step-${suffix}:`);
    }
  });
});
