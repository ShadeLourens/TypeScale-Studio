// Shown automatically while a shared scale is still loading.
export default function SharedScaleLoading() {
  return (
    <div className="flex min-h-screen flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 rounded-sm bg-muted-foreground/10" />
        <div className="h-8 w-28 rounded-sm bg-muted-foreground/10" />
      </div>
      <div
        className="surface motion-safe:animate-fade-in flex flex-col gap-4 p-4"
        role="status"
        aria-label="Loading scale"
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded-sm bg-muted-foreground/10" />
        ))}
      </div>
    </div>
  );
}
