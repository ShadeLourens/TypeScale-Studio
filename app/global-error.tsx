"use client";

// Root-level fallback — only fires if the root layout itself throws, which
// this app's simple layout makes unlikely. Must render its own <html>/
// <body> per the App Router convention (it replaces the layout, not just
// the page), and deliberately imports nothing else from the app — a broken
// root layout is exactly the situation where pulling in more app code
// could compound the failure.
export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#161826",
          color: "#e9e9ed",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <p style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: "0.875rem", color: "#9397ab", margin: 0 }}>
          The app hit an unexpected error.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            borderRadius: "4px",
            border: "1px solid #9184d9",
            background: "transparent",
            color: "#e9e9ed",
            padding: "0.375rem 0.75rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
