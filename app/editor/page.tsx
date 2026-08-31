"use client";

import { Suspense, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { editorReducer, initialEditorConfig } from "@/lib/editor-reducer";
import { resolveScale, type ScaleConfig } from "@/lib/scale";
import { decodeConfig, encodeConfig } from "@/lib/url-state";
import { toCSS, toTailwind, toTokens } from "@/lib/exports";
import { saveScale } from "@/lib/actions/scales";
import { SAVE_STASH_KEY, parsePendingSave } from "@/lib/save-stash";
import { useAppTheme } from "@/lib/use-app-theme";
import { ControlsPanel } from "@/components/editor/ControlsPanel";
import { ScalePreview } from "@/components/editor/ScalePreview";
import { ExportSheet } from "@/components/editor/ExportSheet";
import { SaveButton } from "@/components/editor/SaveButton";

const URL_PARAM = "c";
const URL_SYNC_DEBOUNCE_MS = 300;

// Loads the scale from the link (if there is one) when the page first opens.
function initConfigFromSearchParam(paramValue: string | null): ScaleConfig {
  if (!paramValue) return initialEditorConfig;
  return decodeConfig(paramValue) ?? initialEditorConfig;
}

// This whole page works around one thing: a scale's settings, kept in one
// place, that everything else is calculated from. The link in the address
// bar is kept in sync with those settings, so the page can always be
// reopened or shared exactly as it was.
function EditorPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [config, dispatch] = useReducer(
    editorReducer,
    searchParams.get(URL_PARAM),
    initConfigFromSearchParam,
  );

  // A scale's theme now just follows the app's own Light/Dark toggle,
  // rather than being set separately.
  const appTheme = useAppTheme();
  useEffect(() => {
    if (config.theme !== appTheme) {
      dispatch({ type: "setTheme", theme: appTheme });
    }
  }, [appTheme, config.theme]);
  // Lets someone type their own preview text — kept separate from the
  // scale's saved settings, so it's just for trying things out and resets
  // whenever the page reloads.
  const [sampleText, setSampleText] = useState<string | undefined>(undefined);

  const steps = useMemo(() => resolveScale(config), [config]);
  const exportOutputs = useMemo(
    () => ({
      css: toCSS(config),
      tailwind: toTailwind(config),
      tokens: toTokens(config),
    }),
    [config],
  );

  // Skips updating the link the very first time the page loads, since it
  // would just be rewriting the same link that's already there.
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

  // If someone tried to save a scale before logging in, this picks it back
  // up once they're signed in and finishes saving it for them.
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
    <div className="flex min-h-screen flex-col items-center gap-6 p-6 editor:flex-row editor:items-stretch">
      <ControlsPanel config={config} dispatch={dispatch} />
      <ScalePreview
        steps={steps}
        theme={config.theme}
        sampleText={sampleText}
        onSampleTextChange={setSampleText}
      />
      <ExportSheet
        css={exportOutputs.css}
        tailwind={exportOutputs.tailwind}
        tokens={exportOutputs.tokens}
      >
        <SaveButton config={config} />
      </ExportSheet>
    </div>
  );
}

// Next.js requires this kind of page to be wrapped like this when it reads
// the link's search text (the ?c=... part of the URL).
export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <EditorPageInner />
    </Suspense>
  );
}
