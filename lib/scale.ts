// ── The single source of truth (spec.md §2) ─────────────────────────────

// Hoisted to const arrays (rather than inlined into the interfaces below) so
// lib/url-state.ts can import these exact value sets for its runtime
// validator instead of hand-copying them — one source of truth, no drift risk
// if a value is ever added or removed here.
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

// The five self-hosted families available in the picker (see lib/fonts.ts
// for the actual font files/CSS variables). Closed union, not a plain
// string, so an unknown family can never survive decodeConfig/isScaleConfig.
export const CURATED_FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Playfair Display",
] as const;
export type CuratedFontFamily = (typeof CURATED_FONT_FAMILIES)[number];

// Per-family metadata the picker and font loaders both need — one source so
// they can't drift apart. Playfair Display's only loaded instances are
// italic (see assets/fonts/playfair-display/), so consumers that render text
// key off `family === "Playfair Display"` for fontStyle rather than this map
// carrying a style field only one family would ever use.
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

export interface ScaleConfig {
  /** Schema version — lets you migrate old saved configs later */
  version: 1;

  base: {
    /** Base font size in px (root of the scale) */
    fontSize: number; // default 16, range 12–24
    /** Scale ratio, e.g. 1.25 = Major Third */
    ratio: number; // default 1.25
    /** Steps above base (h1..h6 territory) */
    stepsUp: number; // default 5, max 8
    /** Steps below base (small, caption) */
    stepsDown: number; // default 2, max 3
    /** Rounding for computed sizes */
    rounding: (typeof ROUNDING_VALUES)[number];
  };

  fonts: {
    heading: FontChoice;
    body: FontChoice;
  };

  /**
   * Per-step overrides, keyed by step index (e.g. "3" = 3 steps up).
   * Only stores the fields the user actually changed — keeps configs small
   * and means changing the ratio doesn't wipe manual tweaks.
   */
  overrides: Record<string, StepOverride>;

  theme: (typeof THEME_VALUES)[number];
}

export interface FontChoice {
  /** One of the curated, self-hosted families — see CURATED_FONT_FAMILIES. */
  family: CuratedFontFamily;
  /** Weights actually loaded — keep to what's used */
  weights: number[]; // e.g. [400, 600]
  fallback: (typeof FONT_FALLBACK_VALUES)[number];
}

export interface StepOverride {
  weight?: number;
  lineHeight?: number; // unitless, e.g. 1.4
  letterSpacing?: number; // em, e.g. -0.02
  /** Optional semantic label, e.g. "Display", "Caption" */
  label?: string;
}

// ── Derived (computed, never stored) ────────────────────────────────────

export interface ResolvedStep {
  step: number; // -stepsDown..+stepsUp, 0 = base
  label: string; // "Step +3" or user label
  fontSizePx: number;
  fontSizeRem: number;
  weight: number;
  lineHeight: number;
  letterSpacing: number;
  /** Which curated family this step renders in — see the heading/body split in resolveScale(). */
  family: CuratedFontFamily;
  fallback: (typeof FONT_FALLBACK_VALUES)[number];
}

/** Standard browser root font-size, used to convert px to rem regardless of scale base. */
const ROOT_FONT_SIZE_PX = 16;

/** Decimal precision used to strip float noise (31.3, never 31.299999999999997). */
const DISPLAY_PRECISION = 4;

/** Rounds a number to a fixed number of decimal places. */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Takes a raw (unrounded) px size and applies the config's `rounding` mode,
 * returning both the px and rem values kept in sync with each other.
 */
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

/** Default label for a step when the user hasn't set one: "Base", "Step +3", "Step -2". */
function defaultLabel(step: number): string {
  if (step === 0) return "Base";
  return step > 0 ? `Step +${step}` : `Step ${step}`;
}

/** Default font weight for a step when the user hasn't overridden it. */
function defaultWeight(): number {
  return 400;
}

/** Larger steps read tighter, smaller steps read looser — common type-scale convention. */
function defaultLineHeight(step: number): number {
  const raw = 1.5 - step * 0.05;
  return roundTo(Math.min(1.6, Math.max(1.1, raw)), 2);
}

/** Display sizes tighten (negative tracking), small sizes open up (positive tracking). */
function defaultLetterSpacing(step: number): number {
  if (step > 0) return roundTo(Math.max(-0.005 * step, -0.03), 3);
  if (step < 0) return roundTo(Math.min(0.01 * -step, 0.02), 3);
  return 0;
}

/**
 * Pure function — the heart of the app. Unit-test this.
 *
 * Walks every step from -stepsDown to +stepsUp, computes its font size from
 * fontSize * ratio^step, then layers any matching StepOverride on top of the
 * computed defaults (weight, lineHeight, letterSpacing, label).
 */
export function resolveScale(config: ScaleConfig): ResolvedStep[] {
  const { fontSize, ratio, stepsUp, stepsDown, rounding } = config.base;
  const steps: ResolvedStep[] = [];

  for (let step = -stepsDown; step <= stepsUp; step++) {
    // ratio^step: negative steps divide down from the base, positive steps multiply up.
    const rawPx = fontSize * ratio ** step;
    const { fontSizePx, fontSizeRem } = applyRounding(rawPx, rounding);
    const override = config.overrides[String(step)];
    // step 0 ("Base") and everything below it is body-sized text (paragraph
    // copy, captions); only steps above base are heading territory (h1-h6).
    // This is the one place that rule lives — nothing downstream re-derives it.
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
