import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getScaleBySlug } from "@/lib/scales-query";
import { resolveScale } from "@/lib/scale";
import { encodeConfig } from "@/lib/url-state";
import { createClient } from "@/lib/supabase/server";
import { ScalePreview } from "@/components/editor/ScalePreview";
import { ShareHeader } from "@/components/share/ShareHeader";

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

// The public page anyone can view when they open a shared link. Loads and
// renders entirely on the server, so it opens fast and previews nicely
// when shared elsewhere. "Open in editor" doesn't require logging in.
export default async function SharedScalePage({ params }: PageProps) {
  const { slug } = await params;
  const scale = await getScaleBySlug(slug);
  if (!scale) notFound();

  // Only the person who saved this scale gets to rename it from here.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === scale.ownerId;

  return (
    <div className="flex min-h-screen flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ShareHeader
          scaleId={scale.id}
          slug={slug}
          initialName={scale.name}
          isOwner={isOwner}
        />
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
