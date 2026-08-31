"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

// The page always starts as "dark" before the browser finishes loading
// (matching app/layout.tsx's default), then this gets checked again and
// corrected right after, in case someone had actually chosen light mode.
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

/** Tells you whether the app is currently in light or dark mode, and
 * updates automatically when the toggle button is clicked. */
export function useAppTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
