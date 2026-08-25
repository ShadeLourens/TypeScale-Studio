// Textured backdrop for every `surface` glass panel to actually blur
// against — without this, backdrop-filter has nothing but a flat page
// color behind it, so glass panels read as plain translucent boxes rather
// than glass (confirmed by eye after milestone 6 first shipped). Purely
// decorative (aria-hidden), fixed behind all page content — no
// interactivity, no client boundary needed.
//
// Positioned via `fixed` + DOM order (first child of <body>, see
// app/layout.tsx), not a negative z-index: a fixed element with z-index:-1
// can render behind <body>'s own painted background in some engines,
// which would make it invisible. Plain DOM order avoids that risk
// entirely and is also what the original reference does.
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
      {/* Faint grain so the blurred wash doesn't look like a flat gradient —
          dot color tracks --color-foreground so it reads on both themes. */}
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
