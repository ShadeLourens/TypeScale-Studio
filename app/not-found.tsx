import Link from "next/link";

// Global 404 — catches the intentional "/" 404 (see app/layout.tsx) and any
// mistyped route. Previously absent, so every 404 fell through to Next's
// fully generic default page.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="surface flex flex-col items-center gap-3 p-8">
        <p className="text-lg font-semibold">Page not found</p>
        <p className="text-sm text-muted-foreground">
          That page doesn&apos;t exist.
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
