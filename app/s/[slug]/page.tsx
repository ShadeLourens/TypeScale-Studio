import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getScaleBySlug } from "@/lib/scales-query";
import { resolveScale } from "@/lib/scale";
import { encodeConfig } from "@/lib/url-state";
import { ScalePreview } from "@/components/editor/ScalePreview";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const scale = await getScaleBySlug(slug);
  if (!scale) return { title: "Scale not found – TypeScale Studio" };

  return {
    title: `${scale.name} – TypeScale Studio`,
    description: `A ${scale.config.base.ratio}× type scale in ${scale.config.fonts.heading.family}, built with TypeScale Studio.`,
  };
}

// Server component, no "use client" — fetches by slug and renders fully on
// the server so shared links are fast and crawlable. "Open in editor" forks
// the config into URL state (no auth needed) via the same encodeConfig the
// editor's own URL sync already uses.
export default async function SharedScalePage({ params }: PageProps) {
  const { slug } = await params;
  const scale = await getScaleBySlug(slug);
  if (!scale) notFound();

  return (
    <div className="flex min-h-screen flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{scale.name}</h1>
        <Link
          href={`/editor?c=${encodeConfig(scale.config)}`}
          className="rounded-sm border border-border px-3 py-1.5 text-sm transition-colors hover:border-accent"
        >
          Open in editor
        </Link>
      </div>
      <ScalePreview
        steps={resolveScale(scale.config)}
        theme={scale.config.theme}
        readOnly
      />
    </div>
  );
}
