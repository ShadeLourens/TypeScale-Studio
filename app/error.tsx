"use client";

// Required by convention: a route-level error boundary must be a Client
// Component. Catches uncaught render errors anywhere in the app segment
// instead of Next's generic error overlay. `reset` re-renders the segment,
// giving the user a real recovery path rather than a dead end.
export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="surface flex flex-col items-center gap-3 p-8">
        <p className="text-lg font-semibold">Something went wrong</p>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-sm border border-accent px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-accent/10"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
