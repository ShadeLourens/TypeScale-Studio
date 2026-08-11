import type { Metadata } from "next";
import { FONT_CLASS_NAMES } from "@/lib/fonts";
import "./globals.css";

// A theme provider and a toaster still belong to the later design-pass
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
      {/* Every curated family's CSS variable is defined here so the editor
          and the public /s/[slug] page both get them for free. */}
      <body className={FONT_CLASS_NAMES}>{children}</body>
    </html>
  );
}
