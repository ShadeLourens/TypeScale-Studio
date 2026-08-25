import type { Metadata } from "next";
import { FONT_CLASS_NAMES } from "@/lib/fonts";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import "./globals.css";

// There's no app/page.tsx yet, so "/" 404s on purpose; the real editor
// lives at /editor.
export const metadata: Metadata = { title: "TypeScale Studio" };

// Dark is the app's default theme (not OS-detected) — a deliberate
// differentiator, not a prefers-color-scheme read: every other type-scale
// tool defaults to light. The inline script below only ever overrides to
// light, when that's the stored choice — there's no matchMedia branch.
const THEME_INIT_SCRIPT = `(function(){try{
  var t=localStorage.getItem("typescale-studio:theme");
  if(t==="light"){document.documentElement.setAttribute("data-theme","light");}
}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // data-theme="dark" is the server-rendered default (keeps the route
    // statically prerenderable — a server-side cookie read here would opt
    // the whole app out of that). suppressHydrationWarning only on <html>,
    // since the inline script below may have already overridden the
    // attribute before React hydrates.
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Runs before paint, synchronously — this is what prevents a
            flash of the wrong theme on load for a returning visitor who
            chose light mode. Must stay a raw <script>, not next/script:
            next/script's earliest strategy still doesn't guarantee
            pre-paint execution the way a plain <head> script does. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      {/* Every curated family's CSS variable is defined here so the editor
          and the public /s/[slug] page both get them for free. */}
      <body className={FONT_CLASS_NAMES}>
        {/* First in DOM order, `fixed`, no z-index — see the component's
            own comment for why that's deliberate. Gives every `surface`
            glass panel something textured behind it to actually blur. */}
        <AmbientBackground />
        <header className="surface sticky top-0 z-10 mx-3 mt-3 flex items-center justify-between gap-3 rounded-lg px-4 py-2.5">
          <span className="text-sm font-semibold tracking-tight">
            TypeScale Studio
          </span>
          <ThemeToggle />
        </header>
        {children}
      </body>
    </html>
  );
}
