// ── The single source of truth (spec.md §2) ─────────────────────────────

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
    rounding: "none" | "nearest-px" | "nearest-quarter-rem";
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

  theme: "light" | "dark";
}

export interface FontChoice {
  /** Google Fonts family name, e.g. "Inter" */
  family: string;
  /** Weights actually loaded — keep to what's used */
  weights: number[]; // e.g. [400, 600]
  fallback: "sans-serif" | "serif" | "monospace";
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
  rounding: ScaleConfig["base"]["rounding"]
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

    steps.push({
      step,
      label: override?.label ?? defaultLabel(step),
      fontSizePx,
      fontSizeRem,
      weight: override?.weight ?? defaultWeight(),
      lineHeight: override?.lineHeight ?? defaultLineHeight(step),
      letterSpacing: override?.letterSpacing ?? defaultLetterSpacing(step),
    });
  }

  return steps;
}
