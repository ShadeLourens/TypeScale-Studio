import type { ResolvedStep, ScaleConfig } from "@/lib/scale";
import { FONT_CSS_VARS } from "@/lib/fonts";
import { THEME_COLORS } from "@/lib/theme-colors";

const DEFAULT_SAMPLE_TEXT = "The quick brown fox";

export interface ScalePreviewProps {
  steps: ResolvedStep[];
  // Light or dark, just for this preview — separate from the app's own
  // light/dark toggle.
  theme: ScaleConfig["theme"];
  // Used on the public share page, where the preview isn't editable.
  readOnly?: boolean;
  // The text shown at every size — defaults to a short sample phrase.
  // Only editable when onSampleTextChange is provided (in the editor).
  sampleText?: string;
  onSampleTextChange?: (text: string) => void;
}

export function ScalePreview({
  steps,
  theme,
  readOnly = false,
  sampleText,
  onSampleTextChange,
}: ScalePreviewProps) {
  const colors = THEME_COLORS[theme];
  // Shows the biggest (heading) size at the top and the smallest at the
  // bottom, like a real page would.
  const displaySteps = [...steps].reverse();
  const text = sampleText ?? DEFAULT_SAMPLE_TEXT;

  return (
    <section
      aria-label="Scale preview"
      data-readonly={readOnly || undefined}
      className="flex w-full flex-col gap-6 rounded-lg p-4"
      style={{ background: colors.background, color: colors.foreground }}
    >
      {onSampleTextChange && (
        <label
          className="flex flex-col gap-1 text-xs"
          style={{ color: colors.muted }}
        >
          Preview text
          <input
            type="text"
            value={text}
            onChange={(e) => onSampleTextChange(e.target.value)}
            className="rounded-sm border bg-transparent px-2.5 py-1.5 text-sm transition-colors"
            style={{ borderColor: colors.muted, color: colors.foreground }}
          />
        </label>
      )}
      {displaySteps.map((s) => (
        <div
          key={s.step}
          className="flex items-baseline gap-3 border-b pb-2"
          style={{ borderColor: colors.muted }}
        >
          <span
            className="w-20 shrink-0 text-xs"
            style={{ color: colors.muted }}
          >
            {s.label}
          </span>
          <p
            className="m-0"
            // These sizes are calculated on the fly, so they're set here
            // directly instead of as reusable style classes.
            style={{
              fontFamily: `${FONT_CSS_VARS[s.family]}, ${s.fallback}`,
              fontSize: `${s.fontSizePx}px`,
              fontWeight: s.weight,
              // Playfair Display only comes in italic here.
              fontStyle: s.family === "Playfair Display" ? "italic" : "normal",
              lineHeight: s.lineHeight,
              letterSpacing: `${s.letterSpacing}em`,
            }}
          >
            {text}
          </p>
        </div>
      ))}
    </section>
  );
}
