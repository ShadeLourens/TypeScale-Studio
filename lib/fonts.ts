import localFont from "next/font/local";
import type { CuratedFontFamily } from "./scale";

// The font files themselves live in assets/fonts (see scripts/fetch-fonts.sh
// for how they were downloaded) instead of being loaded from Google at
// runtime, so the app doesn't depend on an outside service to show text.

const inter = localFont({
  src: [
    { path: "../assets/fonts/inter/Inter-Regular.ttf", weight: "400" },
    { path: "../assets/fonts/inter/Inter-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-inter",
  preload: true, // this is the default font, so it's worth loading right away
});

const roboto = localFont({
  src: [
    { path: "../assets/fonts/roboto/Roboto-Regular.ttf", weight: "400" },
    { path: "../assets/fonts/roboto/Roboto-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-roboto",
  preload: false,
});

const openSans = localFont({
  src: [
    { path: "../assets/fonts/open-sans/OpenSans-Regular.ttf", weight: "400" },
    {
      path: "../assets/fonts/open-sans/OpenSans-SemiBold.ttf",
      weight: "600",
    },
  ],
  variable: "--font-open-sans",
  preload: false,
});

const montserrat = localFont({
  src: [
    {
      path: "../assets/fonts/montserrat/Montserrat-Regular.ttf",
      weight: "400",
    },
    {
      path: "../assets/fonts/montserrat/Montserrat-SemiBold.ttf",
      weight: "600",
    },
  ],
  variable: "--font-montserrat",
  preload: false,
});

// Playfair Display is only loaded in italic here — a style choice, not
// an accident (there's no upright version to pick).
const playfairDisplay = localFont({
  src: [
    {
      path: "../assets/fonts/playfair-display/PlayfairDisplay-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../assets/fonts/playfair-display/PlayfairDisplay-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
  ],
  variable: "--font-playfair-display",
  preload: false,
});

// Added to the whole app's <body> in app/layout.tsx, so every page can use
// any of these fonts without loading them separately.
export const FONT_CLASS_NAMES = [
  inter.variable,
  roboto.variable,
  openSans.variable,
  montserrat.variable,
  playfairDisplay.variable,
].join(" ");

export const FONT_CSS_VARS: Record<CuratedFontFamily, string> = {
  Inter: "var(--font-inter)",
  Roboto: "var(--font-roboto)",
  "Open Sans": "var(--font-open-sans)",
  Montserrat: "var(--font-montserrat)",
  "Playfair Display": "var(--font-playfair-display)",
};
