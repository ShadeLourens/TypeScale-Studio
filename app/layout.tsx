import type { Metadata } from "next";
import Image from "next/image";
import { FONT_CLASS_NAMES } from "@/lib/fonts";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import logo from "@/assets/logo/TS-LOGO.png";
import "./globals.css";

// Visiting the site's root address sends people straight to the editor
// (see next.config.ts) instead of showing a separate homepage.
export const metadata: Metadata = { title: "TypeScale Studio" };

// Dark mode is the default here, on purpose — most similar tools default
// to light mode, so this stands out. The script below only ever switches
// to light mode if someone has chosen that before.
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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Runs immediately, before the page is shown, so returning
            visitors who chose light mode never see a flash of dark mode
            first. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      {/* Every font the app uses is loaded here once, so any page can use
          any of them. */}
      <body className={FONT_CLASS_NAMES}>
        {/* The colorful background shapes seen behind the glass panels. */}
        <AmbientBackground />
        <header className="surface sticky top-0 z-10 mx-3 mt-3 flex items-center justify-between gap-3 rounded-lg px-4 py-2.5">
          <Image src={logo} alt="TypeScale Studio" priority className="h-7 w-auto" />
          <ThemeToggle />
        </header>
        {children}
      </body>
    </html>
  );
}
