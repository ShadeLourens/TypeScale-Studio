"use client";

import { Suspense, useEffect, useMemo, useReducer, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { editorReducer, initialEditorConfig } from "@/lib/editor-reducer";
import { resolveScale, type ScaleConfig } from "@/lib/scale";
import { decodeConfig, encodeConfig } from "@/lib/url-state";
import { toCSS, toTailwind, toTokens } from "@/lib/exports";
import { saveScale } from "@/lib/actions/scales";
import { SAVE_STASH_KEY, parsePendingSave } from "@/lib/save-stash";
import { ControlsPanel } from "@/components/editor/ControlsPanel";
import { ScalePreview } from "@/components/editor/ScalePreview";
import { ExportSheet } from "@/components/editor/ExportSheet";
import { SaveButton } from "@/components/editor/SaveButton";

const URL_PARAM = "c";
const URL_SYNC_DEBOUNCE_MS = 300;

// Runs exactly once on first render (useReducer's lazy-init form) — never on
// later renders, even when searchParams changes from our own replace() calls
// below. That's what avoids a "default config, then replaced" flash on load.
function initConfigFromSearchParam(paramValue: string | null): ScaleConfig {
  if (!paramValue) return initialEditorConfig;
  return decodeConfig(paramValue) ?? initialEditorConfig;
}

// The whole editor is: one reducer holding a ScaleConfig, run through the pure
// resolveScale() on every change, rendered by two dumb components. No other
// state lives here — this is the "one source of truth" the spec calls for.
// The URL is a mirror of that state, not a second source of truth: it's read
// once to seed the reducer, then kept in sync (debounced) after every change.
function EditorPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [config, dispatch] = useReducer(
    editorReducer,
    searchParams.get(URL_PARAM),
    initConfigFromSearchParam,
  );
  // useMemo avoids recomputing the scale on renders that don't change config
  // (e.g. if this page ever gets sibling state that re-renders independently).
  const steps = useMemo(() => resolveScale(config), [config]);
  const exportOutputs = useMemo(
    () => ({
      css: toCSS(config),
      tailwind: toTailwind(config),
      tokens: toTokens(config),
    }),
    [config],
  );

  // Skip the mount-time run: config is already correct (from the URL or the
  // untouched default) via the lazy initializer above, so re-encoding and
  // replacing on a bare page load would be a pointless URL rewrite before the
  // user has changed anything.
  const isFirstEffectRun = useRef(true);

  useEffect(() => {
    if (isFirstEffectRun.current) {
      isFirstEffectRun.current = false;
      return;
    }
    const timeoutId = setTimeout(() => {
      const encoded = encodeConfig(config);
      router.replace(`${pathname}?${URL_PARAM}=${encoded}`, { scroll: false });
    }, URL_SYNC_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [config, pathname, router]);

  // Restores a config stashed (by SaveButton) before a login redirect, then
  // immediately retries the save now that the user is authenticated.
  //
  // This dispatches loadConfig on mount, which also re-triggers the
  // URL-sync effect above (isFirstEffectRun only skips its very first run,
  // not this one) — a router.replace(...?c=...) gets scheduled ~300ms out
  // at the same time this effect's saveScale call is in flight. Deliberately
  // not suppressed: on success, saveScale (a single DB insert) reliably
  // resolves before 300ms and router.push('/s/[slug]') unmounts this page
  // first, so the pending replace's cleanup cancels it before it fires — on
  // the rare slow-connection case where the timer wins, the worst outcome is
  // one harmless replace immediately followed by the push. On failure, no
  // navigation happens, so letting the URL-sync effect fire is actually
  // correct — it keeps the URL in sync with the restored config so a refresh
  // doesn't lose it.
  useEffect(() => {
    const stashed = parsePendingSave(sessionStorage.getItem(SAVE_STASH_KEY));
    if (!stashed) return;
    sessionStorage.removeItem(SAVE_STASH_KEY);
    dispatch({ type: "loadConfig", config: stashed });
    void saveScale(stashed).then((result) => {
      if (result.ok) router.push(`/s/${result.slug}`);
    });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col gap-6 p-6 md:flex-row">
      <ControlsPanel config={config} dispatch={dispatch} />
      <ScalePreview steps={steps} theme={config.theme} />
      <ExportSheet
        css={exportOutputs.css}
        tailwind={exportOutputs.tailwind}
        tokens={exportOutputs.tokens}
      />
      <SaveButton config={config} />
    </div>
  );
}

// useSearchParams() requires a Suspense boundary or Next bails the whole route
// out of static optimization with a build warning. This route has no static
// content to protect either way, so the fix is just moving the body into an
// inner component and wrapping it here.
export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <EditorPageInner />
    </Suspense>
  );
}
