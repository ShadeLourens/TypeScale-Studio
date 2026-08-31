// Soft, colorful, floating shapes behind every page. They're what makes the
// frosted-glass panels actually look like glass — without something
// colorful behind them to blur, a "glass" panel just looks like a plain
// grey box. Purely decorative, so screen readers skip over it.
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 overflow-hidden pointer-events-none"
    >
      <div
        className="ambient-blob-1 motion-safe:animate-float-1 absolute rounded-full"
        style={{
          top: "-15%",
          left: "-10%",
          width: "60vw",
          height: "60vw",
          filter: "blur(60px)",
        }}
      />
      <div
        className="ambient-blob-2 motion-safe:animate-float-2 absolute rounded-full"
        style={{
          bottom: "-20%",
          right: "-15%",
          width: "70vw",
          height: "70vw",
          filter: "blur(80px)",
        }}
      />
      <div
        className="ambient-blob-3 motion-safe:animate-drift absolute rounded-full"
        style={{
          top: "30%",
          right: "25%",
          width: "35vw",
          height: "35vw",
          filter: "blur(70px)",
        }}
      />
      {/* A faint dotted texture so the colors don't look like a flat, boring gradient. */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--color-foreground) 5%, transparent) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
    </div>
  );
}
