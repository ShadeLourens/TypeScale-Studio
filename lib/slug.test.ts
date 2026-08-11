import { describe, expect, it } from "vitest";
import { generateSlug } from "./slug";

// Format/charset checks only — this is a randomness generator, not a pure
// function of an input, so there's nothing to assert about a specific output.
describe("generateSlug", () => {
  const SLUG_PATTERN = /^[a-z]+-[a-z]+-[a-z0-9]{4}$/;

  it("matches the word-word-xxxx shape across many samples", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateSlug()).toMatch(SLUG_PATTERN);
    }
  });

  it("produces different slugs across calls (not a constant)", () => {
    const slugs = new Set(Array.from({ length: 50 }, () => generateSlug()));
    expect(slugs.size).toBeGreaterThan(1);
  });
});
