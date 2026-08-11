import { isScaleConfig } from "./url-state";
import type { ScaleConfig } from "./scale";

/** sessionStorage key for a config stashed before a login redirect. */
export const SAVE_STASH_KEY = "typescale-studio:pending-save";

const MAX_STASH_AGE_MS = 30 * 60 * 1000;

/** Wraps a config with a timestamp so a stale stash (e.g. an abandoned login
 * flow revisited days later) doesn't silently resurrect and auto-save. */
export function serializePendingSave(config: ScaleConfig): string {
  return JSON.stringify({ config, stashedAt: Date.now() });
}

/**
 * Inverse of serializePendingSave. Never throws — returns null for missing,
 * malformed, expired, or invalid-shape input, mirroring url-state.ts's
 * decodeConfig (this is also untrusted-ish input: sessionStorage a browser
 * extension or a prior app version could have written something unexpected).
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
