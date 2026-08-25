import type { ResolvedStep, ScaleConfig } from "@/lib/scale";
import { FONT_CSS_VARS } from "@/lib/fonts";
import { THEME_COLORS } from "@/lib/theme-colors";

export interface ScalePreviewProps {
  steps: ResolvedStep[];
  // The scale's own stored theme — deliberately independent of the app's
  // own dark/light toggle (ThemeToggle only ever writes data-theme on
  // <html>, which this component never reads). A scale can render light
  // while the app chrome around it is dark, and vice versa.
  theme: ScaleConfig["theme"];
  // Unused for now — reserved so a future public /s/[slug] share page can
  // render this exact component server-side with readOnly set, per the spec's
  // "same component, readOnly prop" reuse pattern.
  readOnly?: boolean;
}

// No "use client" — this is a plain function of props with zero hooks, so it
// can be rendered from a server component later without forcing a client
// boundary (see readOnly above).
export function ScalePreview({
  steps,
  theme,
  readOnly = false,
}: ScalePreviewProps) {
  const colors = THEME_COLORS[theme];

  return (
    <section
      aria-label="Scale preview"
      // A data attribute, not aria-readonly — that ARIA attribute isn't valid
      // on this element's implicit role and trips an eslint a11y warning.
      data-readonly={readOnly || undefined}
      className="flex w-full flex-col gap-6 rounded-lg p-4"
      style={{ background: colors.background, color: colors.foreground }}
    >
      {steps.map((s) => (
        <div
          key={s.step}
          className="flex items-baseline gap-3 border-b pb-2"
          style={{ borderColor: colors.muted }}
        >
          <span className="w-20 shrink-0 text-xs" style={{ color: colors.muted }}>
            {s.label}
          </span>
          <p
            className="m-0"
            // Inline style, not Tailwind classes: these values come from
            // resolveScale() at runtime, and Tailwind can only generate
            // classes for strings it sees at build time.
            style={{
              fontFamily: `${FONT_CSS_VARS[s.family]}, ${s.fallback}`,
              fontSize: `${s.fontSizePx}px`,
              fontWeight: s.weight,
              // Playfair Display's only loaded instances are italic (see
              // lib/fonts.ts) — there's no upright style to fall back to.
              fontStyle: s.family === "Playfair Display" ? "italic" : "normal",
              lineHeight: s.lineHeight,
              letterSpacing: `${s.letterSpacing}em`,
            }}
          >
            The quick brown fox jumps over the lazy dog
          </p>
        </div>
      ))}
    </section>
  );
}
