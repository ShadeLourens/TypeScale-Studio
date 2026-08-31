// ── This file defines what a "type scale" is and how to calculate one ──

// These lists are defined once here so every other file that needs them
// (like the URL and form validation) uses the exact same options.
export const ROUNDING_VALUES = [
  "none",
  "nearest-px",
  "nearest-quarter-rem",
] as const;
export const THEME_VALUES = ["light", "dark"] as const;
export const FONT_FALLBACK_VALUES = [
  "sans-serif",
  "serif",
  "monospace",
] as const;

// The five fonts available in the font picker.
export const CURATED_FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Playfair Display",
] as const;
export type CuratedFontFamily = (typeof CURATED_FONT_FAMILIES)[number];

// Extra details for each font (its backup font, and which weights are
// available). Playfair Display only comes in italic, which is why some
// other files check for that font by name.
export const FONT_META: Record<
  CuratedFontFamily,
  { fallback: (typeof FONT_FALLBACK_VALUES)[number]; weights: number[] }
> = {
  Inter: { fallback: "sans-serif", weights: [400, 600] },
  Roboto: { fallback: "sans-serif", weights: [400, 600] },
  "Open Sans": { fallback: "sans-serif", weights: [400, 600] },
  Montserrat: { fallback: "sans-serif", weights: [400, 600] },
  "Playfair Display": { fallback: "serif", weights: [400, 600] },
};

// All the settings that make up one type scale.
export interface ScaleConfig {
  /** Version number, in case old saved scales ever need updating later. */
  version: 1;

  base: {
    /** The starting font size in px. */
    fontSize: number; // default 15, range 12–24
    /** How much bigger/smaller each step is, e.g. 1.25 = Major Third. */
    ratio: number; // default 1.25
    /** How many sizes go above the base (for headings). */
    stepsUp: number; // default 5, max 8
    /** How many sizes go below the base (for captions, small text). */
    stepsDown: number; // default 2, max 3
    /** How computed sizes get rounded. */
    rounding: (typeof ROUNDING_VALUES)[number];
  };

  fonts: {
    heading: FontChoice;
    body: FontChoice;
  };

  /**
   * Manual tweaks to individual steps, e.g. "3" for the 3rd step up.
   * Only the fields someone actually changed are stored, so changing the
   * ratio later doesn't erase any manual tweaks.
   */
  overrides: Record<string, StepOverride>;

  theme: (typeof THEME_VALUES)[number];
}

export interface FontChoice {
  /** One of the five available fonts. */
  family: CuratedFontFamily;
  /** Which weights (e.g. regular, bold) are loaded for this font. */
  weights: number[]; // e.g. [400, 600]
  fallback: (typeof FONT_FALLBACK_VALUES)[number];
}

export interface StepOverride {
  weight?: number;
  lineHeight?: number; // unitless, e.g. 1.4
  letterSpacing?: number; // em, e.g. -0.02
  /** Optional name for this step, e.g. "Display", "Caption". */
  label?: string;
}

// ── Everything below is calculated, not stored ──

export interface ResolvedStep {
  step: number; // -stepsDown..+stepsUp, 0 = base
  label: string; // "Step +3" or a custom label
  fontSizePx: number;
  fontSizeRem: number;
  weight: number;
  lineHeight: number;
  letterSpacing: number;
  /** Which font this step uses. */
  family: CuratedFontFamily;
  fallback: (typeof FONT_FALLBACK_VALUES)[number];
}

/** A standard browser's default font size, used to convert px to rem. */
const ROOT_FONT_SIZE_PX = 16;

/** How many decimal places to keep, so sizes look like 31.3, not 31.299999999999997. */
const DISPLAY_PRECISION = 4;

/** Rounds a number to a fixed number of decimal places. */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Applies the chosen rounding style to a calculated size. */
function applyRounding(
  rawPx: number,
  rounding: ScaleConfig["base"]["rounding"],
): { fontSizePx: number; fontSizeRem: number } {
  switch (rounding) {
    case "nearest-px": {
      const fontSizePx = Math.round(rawPx);
      return {
        fontSizePx,
        fontSizeRem: roundTo(fontSizePx / ROOT_FONT_SIZE_PX, DISPLAY_PRECISION),
      };
    }
    case "nearest-quarter-rem": {
      const fontSizeRem = Math.round((rawPx / ROOT_FONT_SIZE_PX) * 4) / 4;
      return {
        fontSizePx: roundTo(fontSizeRem * ROOT_FONT_SIZE_PX, DISPLAY_PRECISION),
        fontSizeRem,
      };
    }
    case "none":
    default:
      return {
        fontSizePx: roundTo(rawPx, DISPLAY_PRECISION),
        fontSizeRem: roundTo(rawPx / ROOT_FONT_SIZE_PX, DISPLAY_PRECISION),
      };
  }
}

/** The default name for a step, e.g. "Base", "Step +3", "Step -2". */
function defaultLabel(step: number): string {
  if (step === 0) return "Base";
  return step > 0 ? `Step +${step}` : `Step ${step}`;
}

/** The default font weight, used unless a step has its own override. */
function defaultWeight(): number {
  return 400;
}

/** Bigger text sits tighter, smaller text sits looser — a common type design rule. */
function defaultLineHeight(step: number): number {
  const raw = 1.5 - step * 0.05;
  return roundTo(Math.min(1.6, Math.max(1.1, raw)), 2);
}

/** Bigger text spaces its letters tighter, smaller text spaces them wider. */
function defaultLetterSpacing(step: number): number {
  if (step > 0) return roundTo(Math.max(-0.005 * step, -0.03), 3);
  if (step < 0) return roundTo(Math.min(0.01 * -step, 0.02), 3);
  return 0;
}

/**
 * The main calculation this whole app is built around: turns one set of
 * settings into a full list of font sizes, one per step, each with its
 * weight, spacing, and font already worked out.
 */
export function resolveScale(config: ScaleConfig): ResolvedStep[] {
  const { fontSize, ratio, stepsUp, stepsDown, rounding } = config.base;
  const steps: ResolvedStep[] = [];

  for (let step = -stepsDown; step <= stepsUp; step++) {
    // Each step multiplies (or divides) the base size by the ratio.
    const rawPx = fontSize * ratio ** step;
    const { fontSizePx, fontSizeRem } = applyRounding(rawPx, rounding);
    const override = config.overrides[String(step)];
    // Steps above the base use the heading font; the base and everything
    // below it use the body font.
    const role = step > 0 ? config.fonts.heading : config.fonts.body;

    steps.push({
      step,
      label: override?.label ?? defaultLabel(step),
      fontSizePx,
      fontSizeRem,
      weight: override?.weight ?? defaultWeight(),
      lineHeight: override?.lineHeight ?? defaultLineHeight(step),
      letterSpacing: override?.letterSpacing ?? defaultLetterSpacing(step),
      family: role.family,
      fallback: role.fallback,
    });
  }

  return steps;
}
