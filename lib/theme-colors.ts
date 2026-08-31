/** The light and dark colors used for a scale's own preview and its share
 * image. Kept separate from the rest of the app's colors (in globals.css)
 * since a saved scale can have its own theme, independent of the app. */
export const THEME_COLORS = {
  light: { background: "#f5f4ff", foreground: "#1e1c29", muted: "#6b6f85" },
  dark: { background: "#161826", foreground: "#e9e9ed", muted: "#9397ab" },
} as const;
