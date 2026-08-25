"use client";

import { useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "typescale-studio:theme";

type Theme = "light" | "dark";

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

// Matches the static data-theme="dark" default rendered in app/layout.tsx —
// useSyncExternalStore uses this during SSR/hydration, then re-syncs to the
// real client value (getSnapshot, which reads whatever the inline FOUC
// script already wrote) right after. This is the textbook use of the hook:
// subscribing to state that lives outside React (the DOM attribute), where
// the server's best guess and the client's actual value can briefly
// disagree — no manual effect/setState-on-mount needed to correct it.
function getServerSnapshot(): Theme {
  return "dark";
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function applyTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_STORAGE_KEY, next);
}

// App-wide toggle only — writes data-theme on <html>, which only the app's
// own dark: utilities key off (see the @custom-variant in globals.css).
// ScaleConfig.theme (wired separately, in ScalePreview) never touches this
// attribute, so "dark chrome, light-themed scale" is a real, independent
// state, not a contradiction.
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
