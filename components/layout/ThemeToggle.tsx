"use client";

import { useAppTheme, type Theme } from "@/lib/use-app-theme";

const THEME_STORAGE_KEY = "typescale-studio:theme";

function applyTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_STORAGE_KEY, next);
}

// The light/dark toggle shown in the top bar of every page.
export function ThemeToggle() {
  const theme = useAppTheme();

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const apply = () => applyTheme(next);
    if (
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      document.startViewTransition
    ) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-accent"
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
