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

// The exact font files used when generating a preview image. Playfair
// Display only comes in italic here — a style choice, not an accident.
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

// Someone could technically set a step's weight to any number, but only
// regular (400) and semi-bold (600) font files are actually loaded here.
// This rounds any other value to whichever of those two is closer, so the
// preview image never breaks or shows the wrong font.
function nearestLoadedWeight(weight: number): 400 | 600 {
  return Math.abs(weight - 600) < Math.abs(weight - 400) ? 600 : 400;
}

/** Loads the font files needed for this particular preview image only —
 * not all five fonts every time, just whichever ones are actually shown. */
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

// Generates the preview image shown when a shared link is posted elsewhere
// (like in a chat app or on social media).
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
  // Shows up to 3 of the biggest sizes, largest first, sized to fit neatly
  // above the footer line without overflowing the image.
  const sample = steps
    .filter((s) => s.step >= 0)
    .sort((a, b) => b.step - a.step)
    .slice(0, 3);

  // Scale names can be long — this trims it down so it always fits.
  const displayName =
    scale.name.length > 30 ? `${scale.name.slice(0, 30)}…` : scale.name;

  // Works out which fonts actually need to be loaded for this image (the
  // body font is always included, since the footer text always uses it),
  // without loading the same font twice.
  const families = [
    ...new Set([...sample.map((s) => s.family), scale.config.fonts.body.family]),
  ];
  const colors = THEME_COLORS[scale.config.theme];

  // If loading a font file ever fails for some reason, fall back to a
  // default font rather than breaking the image entirely.
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
          fontWeight: 400,
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
