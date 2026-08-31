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

/** Creates a friendly link ending like "warm-serif-x7k2" — two words plus
 * 4 random characters. It's not guaranteed to be unique, so whatever calls
 * this will just try again if it happens to clash with an existing one. */
export function generateSlug(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];

  let suffix = "";
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    suffix += SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)];
  }

  return `${adjective}-${noun}-${suffix}`;
}
