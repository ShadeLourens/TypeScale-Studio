import { ImageResponse } from "next/og";
import { getScaleBySlug } from "@/lib/scales-query";
import { resolveScale } from "@/lib/scale";

export const alt = "Type scale preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ slug: string }>;
}

// No `runtime` export — defaults to 'nodejs' (current guidance; 'edge' is
// deprecated). No custom `fonts` either: deliberately uses next/og's built-in
// fallback font rather than the scale's actual Google Font — fetching and
// embedding an arbitrary Google Font per-request is out of scope here.
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

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#ffffff",
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
              fontSize: Math.min(step.fontSizePx, 90),
              fontWeight: step.weight,
              lineHeight: 1,
              color: "#111827",
              marginTop: "8px",
            }}
          >
            {displayName}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", fontSize: 28, color: "#6b7280" }}>
        {`${scale.config.base.ratio}× ratio · ${scale.config.base.fontSize}px base · ${steps.length} steps · TypeScale Studio`}
      </div>
    </div>,
    { ...size },
  );
}
