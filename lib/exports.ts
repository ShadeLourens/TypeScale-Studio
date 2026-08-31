import { resolveScale, type ScaleConfig } from "./scale";

/**
 * Turns a step number into a name like "0", "up-3", or "down-2", so every
 * export format (CSS, Tailwind, JSON) names the same step the same way.
 * Uses words instead of a minus sign because some tools don't handle a
 * literal "-2" well inside a variable name.
 */
function stepSuffix(step: number): string {
  if (step === 0) return "0";
  return step > 0 ? `up-${step}` : `down-${-step}`;
}

/** Formats a font size as text, e.g. "1rem", "3.0518rem". */
function formatRem(rem: number): string {
  return `${rem}rem`;
}

/** Formats letter spacing as text, always ending in "em", e.g. "0em". */
function formatEm(value: number): string {
  return `${value}em`;
}

/** Exports the scale as plain CSS variables. */
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

/** Exports the scale in a format that plugs straight into a Tailwind project. */
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

/** Exports the scale as a simple JSON file, for design tools or other apps. */
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
