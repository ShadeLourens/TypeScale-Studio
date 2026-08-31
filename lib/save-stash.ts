import { isScaleConfig } from "./url-state";
import type { ScaleConfig } from "./scale";

/** Where a scale is temporarily stored while someone logs in to save it. */
export const SAVE_STASH_KEY = "typescale-studio:pending-save";

const MAX_STASH_AGE_MS = 30 * 60 * 1000;

/** Saves a scale along with the current time, so an old, forgotten one
 * doesn't accidentally get saved much later. */
export function serializePendingSave(config: ScaleConfig): string {
  return JSON.stringify({ config, stashedAt: Date.now() });
}

/**
 * Undoes serializePendingSave. Never crashes — returns null if the data is
 * missing, broken, too old, or just not a real scale.
 */
export function parsePendingSave(raw: string | null): ScaleConfig | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { config, stashedAt } = parsed as Record<string, unknown>;
    if (typeof stashedAt !== "number" || Date.now() - stashedAt > MAX_STASH_AGE_MS) return null;
    return isScaleConfig(config) ? config : null;
  } catch {
    return null;
  }
}
