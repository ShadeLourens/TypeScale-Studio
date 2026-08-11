import localFont from "next/font/local";
import type { CuratedFontFamily } from "./scale";

// Self-hosted, static-instance TTFs — see scripts/fetch-fonts.sh for how
// these were sourced (Satori, used by the OG image route, can't parse
// variable fonts, so these have to be real per-weight static files, not the
// variable builds Google Fonts serves by default).

const inter = localFont({
  src: [
    { path: "../assets/fonts/inter/Inter-Regular.ttf", weight: "400" },
    { path: "../assets/fonts/inter/Inter-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-inter",
  preload: true, // the default family — the only one worth preloading
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

// Both files are italic-only (a deliberate pairing choice for this display
// serif — see scripts/fetch-fonts.sh) — no upright style exists to select.
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

// Applied to <body> in app/layout.tsx so every family's CSS variable is
// defined app-wide — the editor and the public /s/[slug] page both get them
// for free from the shared root layout.
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
