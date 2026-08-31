"use client";

// A friendly error page shown if something breaks, with a button to try
// again instead of leaving someone stuck.
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
