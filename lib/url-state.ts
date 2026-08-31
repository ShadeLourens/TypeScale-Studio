import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import {
  CURATED_FONT_FAMILIES,
  FONT_FALLBACK_VALUES,
  ROUNDING_VALUES,
  THEME_VALUES,
} from "./scale";
import type { FontChoice, ScaleConfig, StepOverride } from "./scale";

// This file turns a scale's settings into a shareable link, and back again.
// Since anyone could paste in a made-up or broken link, everything below
// carefully checks the data before the app trusts it.

/** True for plain `{}`-style objects — false for null, arrays, etc. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True for real, usable numbers — false for things like NaN or Infinity. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Checks that a value is one of an allowed list of options. */
function isOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return (
    typeof value === "string" && (options as readonly string[]).includes(value)
  );
}

/** Checks that a font choice (heading or body) is valid. */
function isFontChoice(value: unknown): value is FontChoice {
  if (!isPlainObject(value)) return false;
  if (!isOneOf(value.family, CURATED_FONT_FAMILIES)) return false;
  if (!Array.isArray(value.weights) || !value.weights.every(isFiniteNumber))
    return false;
  return isOneOf(value.fallback, FONT_FALLBACK_VALUES);
}

// A step's manual tweaks are all optional, so this only checks the fields
// that are actually present.
function isStepOverride(value: unknown): value is StepOverride {
  if (!isPlainObject(value)) return false;
  if (value.weight !== undefined && !isFiniteNumber(value.weight)) return false;
  if (value.lineHeight !== undefined && !isFiniteNumber(value.lineHeight))
    return false;
  if (value.letterSpacing !== undefined && !isFiniteNumber(value.letterSpacing))
    return false;
  if (value.label !== undefined && typeof value.label !== "string")
    return false;
  return true;
}

// Checks every manual tweak in the list is valid.
function isOverridesRecord(
  value: unknown,
): value is Record<string, StepOverride> {
  return isPlainObject(value) && Object.values(value).every(isStepOverride);
}

/** Checks that some unknown data is actually a real, usable scale.
 * Used to check links, saved scales, and anything else that comes from
 * outside the app before it's trusted. */
export function isScaleConfig(value: unknown): value is ScaleConfig {
  if (!isPlainObject(value)) return false;
  if (value.version !== 1) return false; // only one version exists so far

  const base = value.base;
  if (!isPlainObject(base)) return false;
  if (!isFiniteNumber(base.fontSize) || !isFiniteNumber(base.ratio))
    return false;
  if (!isFiniteNumber(base.stepsUp) || !isFiniteNumber(base.stepsDown))
    return false;
  if (!isOneOf(base.rounding, ROUNDING_VALUES)) return false;

  const fonts = value.fonts;
  if (!isPlainObject(fonts)) return false;
  if (!isFontChoice(fonts.heading) || !isFontChoice(fonts.body)) return false;

  if (!isOverridesRecord(value.overrides)) return false;
  if (!isOneOf(value.theme, THEME_VALUES)) return false;

  return true;
}

/** Turns a scale's settings into a compact, URL-safe piece of text. */
export function encodeConfig(config: ScaleConfig): string {
  return compressToEncodedURIComponent(JSON.stringify(config));
}

/**
 * Undoes encodeConfig. Never crashes — if the link is broken or was
 * tampered with, it just returns null so the app can fall back to defaults.
 */
export function decodeConfig(encoded: string): ScaleConfig | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    // The library's own types say this always returns a string, but it can
    // actually return null for bad input — so it's checked anyway.
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    return isScaleConfig(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
