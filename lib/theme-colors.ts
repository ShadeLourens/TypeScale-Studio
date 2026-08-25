/** The one shared source for the app's light/dark hex pairs — consumed by
 * ScalePreview (a scoped background, independent of the app's own
 * data-theme toggle) and the OG image route (Satori needs literal hex, not
 * CSS variables). Values must be kept in sync by hand with app/globals.css —
 * CSS can't import from TS, so that file's tokens carry a comment pointing
 * back here. */
export const THEME_COLORS = {
  light: { background: "#f5f4ff", foreground: "#1e1c29", muted: "#6b6f85" },
  dark: { background: "#161826", foreground: "#e9e9ed", muted: "#9397ab" },
} as const;
