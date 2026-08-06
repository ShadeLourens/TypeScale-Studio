import { resolveScale, type ScaleConfig } from "./scale";

/**
 * "0", "up-3", "down-2" — shared by toCSS, toTailwind, and toTokens so the
 * same step is addressable by the same name across every export format.
 * Deliberately avoids signed numbers in the name: Tailwind v4's @theme block
 * treats a second "--" after the namespace as the start of a compound
 * sub-property (e.g. --text-name--line-height), so a name like "step--2"
 * risks being misparsed as an unrecognized compound key and silently dropped.
 */
function stepSuffix(step: number): string {
  if (step === 0) return "0";
  return step > 0 ? `up-${step}` : `down-${-step}`;
}

/** Renders a resolved font size as `${rem}rem`, e.g. "1rem", "3.0518rem". */
function formatRem(rem: number): string {
  return `${rem}rem`;
}

/** Letter spacing always keeps an explicit "em" suffix, including "0em". */
function formatEm(value: number): string {
  return `${value}em`;
}

/** :root block of plain CSS custom properties, four per step (size/line-height/weight/letter-spacing). */
export function toCSS(config: ScaleConfig): string {
  const steps = resolveScale(config);
  const blocks = steps.map((s) => {
    const suffix = stepSuffix(s.step);
    return [
      `  --step-${suffix}: ${formatRem(s.fontSizeRem)};`,
      `  --step-${suffix}-line-height: ${s.lineHeight};`,
      `  --step-${suffix}-weight: ${s.weight};`,
      `  --step-${suffix}-letter-spacing: ${formatEm(s.letterSpacing)};`,
    ].join("\n");
  });
  return `:root {\n${blocks.join("\n\n")}\n}`;
}

/** Tailwind v4 @theme block — pastes directly into a project's CSS to generate
 * real text-step-0 / text-step-up-3 / text-step-down-2 utility classes. */
export function toTailwind(config: ScaleConfig): string {
  const steps = resolveScale(config);
  const blocks = steps.map((s) => {
    const suffix = stepSuffix(s.step);
    return [
      `  --text-step-${suffix}: ${formatRem(s.fontSizeRem)};`,
      `  --text-step-${suffix}--line-height: ${s.lineHeight};`,
      `  --text-step-${suffix}--letter-spacing: ${formatEm(s.letterSpacing)};`,
      `  --text-step-${suffix}--font-weight: ${s.weight};`,
    ].join("\n");
  });
  return `@theme {\n${blocks.join("\n\n")}\n}`;
}

/** Flat JSON design tokens. Intentionally not the full W3C DTCG $type/$value
 * spec — more ceremony than this scope needs. `name` matches the CSS-var /
 * Tailwind-class suffix so this doubles as a lookup table across formats.
 * Only resolved (post-override) values are included — echoing raw
 * config.overrides too would create two disagreeing sources of truth. */
export function toTokens(config: ScaleConfig): string {
  const steps = resolveScale(config);
  const tokens = {
    version: config.version,
    base: { fontSize: config.base.fontSize, ratio: config.base.ratio },
    steps: steps.map((s) => ({
      step: s.step,
      name: `step-${stepSuffix(s.step)}`,
      label: s.label,
      fontSize: { px: s.fontSizePx, rem: s.fontSizeRem },
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      weight: s.weight,
    })),
    fonts: config.fonts,
    theme: config.theme,
  };
  return JSON.stringify(tokens, null, 2);
}
