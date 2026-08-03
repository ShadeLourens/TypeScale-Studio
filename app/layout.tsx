import type { Metadata } from "next";
import "./globals.css";

// Required by Next's App Router for any route to render, but deliberately bare —
// fonts, a theme provider, and a toaster all belong to the later design-pass
// milestone, not this one. There's no app/page.tsx yet, so "/" 404s on purpose;
// the real editor lives at /editor.
export const metadata: Metadata = { title: "TypeScale Studio" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
