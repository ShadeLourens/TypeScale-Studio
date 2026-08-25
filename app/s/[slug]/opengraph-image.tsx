import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getScaleBySlug } from "@/lib/scales-query";
import { resolveScale, type CuratedFontFamily } from "@/lib/scale";
import { THEME_COLORS } from "@/lib/theme-colors";

export const alt = "Type scale preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ slug: string }>;
}

// Static per-weight instances only — Satori (the engine behind ImageResponse)
// can't parse variable fonts. See scripts/fetch-fonts.sh for how these were
// sourced. Playfair Display's only loaded instances are italic (deliberate
// pairing choice, see lib/fonts.ts) — there's no upright style to select.
const FONT_FILES: Record<
  CuratedFontFamily,
  { weight: 400 | 600; style: "normal" | "italic"; file: string }[]
> = {
  Inter: [
    { weight: 400, style: "normal", file: "inter/Inter-Regular.ttf" },
    { weight: 600, style: "normal", file: "inter/Inter-SemiBold.ttf" },
  ],
  Roboto: [
    { weight: 400, style: "normal", file: "roboto/Roboto-Regular.ttf" },
    { weight: 600, style: "normal", file: "roboto/Roboto-SemiBold.ttf" },
  ],
  "Open Sans": [
    { weight: 400, style: "normal", file: "open-sans/OpenSans-Regular.ttf" },
    {
      weight: 600,
      style: "normal",
      file: "open-sans/OpenSans-SemiBold.ttf",
    },
  ],
  Montserrat: [
    {
      weight: 400,
      style: "normal",
      file: "montserrat/Montserrat-Regular.ttf",
    },
    {
      weight: 600,
      style: "normal",
      file: "montserrat/Montserrat-SemiBold.ttf",
    },
  ],
  "Playfair Display": [
    {
      weight: 400,
      style: "italic",
      file: "playfair-display/PlayfairDisplay-Italic.ttf",
    },
    {
      weight: 600,
      style: "italic",
      file: "playfair-display/PlayfairDisplay-SemiBoldItalic.ttf",
    },
  ],
};

// A StepOverride's weight is an unconstrained number (spec.md §2 lets a
// designer set anything) — but we've only ever loaded 400/600 instances per
// family (see FONT_FILES). Satori doesn't nearest-match a requested weight
// against the fonts it was given the way a browser does — an unmatched
// weight (e.g. a stray "4" from a half-finished edit) makes it silently fall
// back to a different font entirely rather than the closest loaded weight of
// the right family. Snapping here keeps the rendered line in its intended
// family regardless of what a step override actually stored.
function nearestLoadedWeight(weight: number): 400 | 600 {
  return Math.abs(weight - 600) < Math.abs(weight - 400) ? 600 : 400;
}

/** Loads both weight instances for each distinct family actually needed —
 * only the families present in the sampled steps, never all five. */
async function loadFontsFor(families: CuratedFontFamily[]) {
  return Promise.all(
    families.flatMap((family) =>
      FONT_FILES[family].map(async ({ weight, style, file }) => ({
        name: family,
        weight,
        style,
        data: await readFile(join(process.cwd(), "assets/fonts", file)),
      })),
    ),
  );
}

// No `runtime` export — defaults to 'nodejs' (current guidance; 'edge' is
// deprecated) — required for the node:fs font reads below to work at all.
export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const scale = await getScaleBySlug(slug);

  if (!scale) {
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          fontSize: 48,
          color: "#6b7280",
        }}
      >
        Scale not found
      </div>,
      { ...size },
    );
  }

  const steps = resolveScale(scale.config);
  // Largest-first sample of the base and up to 2 steps above it. Worst-case
  // height check: 3 lines x 90px cap x lineHeight:1 = 270px, + 2x8px margins
  // = 286px, well inside the 630 - 128 (padding) = 502px available above the
  // footer line — a larger sample/cap could clip or push the footer off-canvas.
  const sample = steps
    .filter((s) => s.step >= 0)
    .sort((a, b) => b.step - a.step)
    .slice(0, 3);

  // scale.name can be up to 200 chars (see MAX_NAME_LENGTH in scales.ts) and
  // is rendered once per sample line — truncate before it reaches the image.
  const displayName =
    scale.name.length > 30 ? `${scale.name.slice(0, 30)}…` : scale.name;

  // Usually just the heading family (the default stepsUp:5 puts the whole
  // sample above base) — but a small stepsUp can pull step 0 (body font)
  // into the sample too, which doubles as a nice showcase of the actual
  // heading/body pairing in one image. The body family is always included
  // even if no sampled step needs it, because the footer line below is
  // always set in it — once a custom `fonts` array is passed to
  // ImageResponse at all, Satori appears to default any *unmatched* family
  // (including "no family specified") to `fonts[0]` rather than falling back
  // to its own generic default, so the footer needs a real, loaded family
  // rather than being left unset. Dedupe so an overlapping choice (or
  // heading === body) doesn't read the same files twice.
  const families = [
    ...new Set([...sample.map((s) => s.family), scale.config.fonts.body.family]),
  ];
  const colors = THEME_COLORS[scale.config.theme];

  // A missing/corrupt font file on disk should degrade to next/og's built-in
  // fallback font, never break the image route — this route always returns
  // a PNG, font-loading failure or not.
  let fonts: Awaited<ReturnType<typeof loadFontsFor>> | undefined;
  try {
    fonts = await loadFontsFor(families);
  } catch {
    fonts = undefined;
  }

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: colors.background,
        padding: "64px",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        {sample.map((step) => (
          <div
            key={step.step}
            style={{
              display: "flex",
              fontFamily: fonts ? step.family : undefined,
              fontSize: Math.min(step.fontSizePx, 90),
              fontWeight: nearestLoadedWeight(step.weight),
              fontStyle: step.family === "Playfair Display" ? "italic" : "normal",
              lineHeight: 1,
              color: colors.foreground,
              marginTop: "8px",
            }}
          >
            {displayName}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: fonts ? scale.config.fonts.body.family : undefined,
          fontStyle:
            scale.config.fonts.body.family === "Playfair Display"
              ? "italic"
              : "normal",
          fontWeight: 400, // explicit — an unset weight risks the same unmatched-font fallback nearestLoadedWeight guards against above
          fontSize: 28,
          color: colors.muted,
        }}
      >
        {`${scale.config.base.ratio}× ratio · ${scale.config.base.fontSize}px base · ${steps.length} steps · TypeScale Studio`}
      </div>
    </div>,
    { ...size, fonts },
  );
}
