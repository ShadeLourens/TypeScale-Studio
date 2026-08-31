import Link from "next/link";

// Shown specifically when a shared link doesn't match any real scale,
// with wording more specific than the site's general "page not found" page.
export default function SharedScaleNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="surface flex flex-col items-center gap-3 p-8">
        <p className="text-lg font-semibold">Scale not found</p>
        <p className="text-sm text-muted-foreground">
          This scale doesn&apos;t exist or was deleted.
        </p>
        <Link
          href="/editor"
          className="rounded-sm border border-accent px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-accent/10"
        >
          Open the editor
        </Link>
      </div>
    </div>
  );
}
