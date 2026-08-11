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

// This file has one job: turn a ScaleConfig into a URL-safe string and back.
// A ?c= value comes from wherever the user pastes a link, so decodeConfig
// below treats it as untrusted input — everything from here down to
// isScaleConfig() exists to reject anything that isn't a real, current-shape
// ScaleConfig before the app ever trusts it.

/** True for `{}`-style objects — rejects null, arrays, and primitives. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Rejects NaN/Infinity too, not just non-numbers — a URL can spell either. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Checks value is a string that's one of the given literal-union options,
 * e.g. isOneOf(value, ROUNDING_VALUES) for the "none"/"nearest-px"/... union. */
function isOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return (
    typeof value === "string" && (options as readonly string[]).includes(value)
  );
}

/** Validates one FontChoice (config.fonts.heading or .body). */
function isFontChoice(value: unknown): value is FontChoice {
  if (!isPlainObject(value)) return false;
  if (!isOneOf(value.family, CURATED_FONT_FAMILIES)) return false;
  if (!Array.isArray(value.weights) || !value.weights.every(isFiniteNumber))
    return false;
  return isOneOf(value.fallback, FONT_FALLBACK_VALUES);
}

// Every StepOverride field is optional — only type-check fields that are present.
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

// overrides is keyed by step number as a string ("3", "-1", ...) — we only
// check that every value is a well-formed StepOverride; the keys themselves
// aren't validated (see url-state.test.ts / the plan notes for why that's fine).
function isOverridesRecord(
  value: unknown,
): value is Record<string, StepOverride> {
  return isPlainObject(value) && Object.values(value).every(isStepOverride);
}

/** Top-level check: is this unknown value actually a valid ScaleConfig?
 * Walks the same shape as the ScaleConfig interface in scale.ts, field by
 * field — keep the two in sync if that interface ever changes. Exported
 * because it's reused wherever untrusted data claims to be a ScaleConfig,
 * not just URL params: the saveScale Server Action (a public POST endpoint)
 * and a defensive re-check on jsonb rows read back from the database. */
export function isScaleConfig(value: unknown): value is ScaleConfig {
  if (!isPlainObject(value)) return false;
  if (value.version !== 1) return false; // only version supported today, no migration path yet

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

/** JSON.stringify + lz-string's URL-safe compression (no extra encodeURIComponent needed). */
export function encodeConfig(config: ScaleConfig): string {
  return compressToEncodedURIComponent(JSON.stringify(config));
}

/**
 * Inverse of encodeConfig. Never throws — returns null for anything that isn't
 * a valid, current-version ScaleConfig, so callers can fall back to defaults.
 */
export function decodeConfig(encoded: string): ScaleConfig | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    // lz-string's shipped .d.ts claims this returns `string`, but it actually
    // returns null at runtime for invalid/empty input — don't trust the type.
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    return isScaleConfig(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
