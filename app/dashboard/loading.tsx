// Next auto-wraps app/dashboard/page.tsx in a Suspense boundary keyed to
// this file — no change needed in the page itself. Shown while the
// getScalesByOwner round trip resolves.
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col gap-6 p-6">
      <h1 className="text-lg font-semibold">Your scales</h1>
      <div
        className="surface motion-safe:animate-fade-in flex flex-col gap-3 p-6"
        role="status"
        aria-label="Loading your scales"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 rounded-sm bg-muted-foreground/10" />
        ))}
      </div>
    </div>
  );
}
