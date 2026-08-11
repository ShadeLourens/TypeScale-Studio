const ADJECTIVES = [
  "warm", "crisp", "bold", "quiet", "sharp", "soft", "tidy", "clean", "subtle", "brisk",
  "calm", "lush", "sleek", "plain", "vivid", "muted", "stark", "gentle", "tight", "airy",
  "dense", "wide", "narrow", "rounded", "angular",
] as const;

const NOUNS = [
  "serif", "sans", "slab", "mono", "grotesk", "italic", "script", "display", "caption", "kerning",
  "tracking", "baseline", "glyph", "ligature", "cascade", "rhythm", "grid", "canvas", "studio", "modular",
  "geometric", "humanist", "editorial", "typeface", "letterform",
] as const;

const SUFFIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const SUFFIX_LENGTH = 4;

/** "warm-serif-x7k2" — two curated words + 4 random chars. Not cryptographically
 * unique on its own; callers (saveScale) retry on a unique-constraint collision. */
export function generateSlug(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];

  let suffix = "";
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    suffix += SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)];
  }

  return `${adjective}-${noun}-${suffix}`;
}
