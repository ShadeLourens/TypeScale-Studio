import { describe, expect, it } from "vitest";
import { compressToEncodedURIComponent } from "lz-string";
import { decodeConfig, encodeConfig } from "./url-state";
import { initialEditorConfig } from "./editor-reducer";
import type { ScaleConfig } from "./scale";

// Two groups of tests: one proves a scale survives being turned into a link
// and back with nothing lost; the other proves that broken or tampered-with
// links never crash the page, and just fall back to a default scale instead.
describe("url-state", () => {
  describe("round trip", () => {
    it("decodeConfig(encodeConfig(x)) returns an equal config for the default config", () => {
      expect(decodeConfig(encodeConfig(initialEditorConfig))).toEqual(
        initialEditorConfig,
      );
    });

    it("round-trips a config with overrides, non-default fonts, and theme", () => {
      const config: ScaleConfig = {
        version: 1,
        base: {
          fontSize: 18,
          ratio: 1.333,
          stepsUp: 4,
          stepsDown: 3,
          rounding: "nearest-quarter-rem",
        },
        fonts: {
          heading: {
            family: "Playfair Display",
            weights: [500, 700],
            fallback: "serif",
          },
          body: { family: "Inter", weights: [400], fallback: "sans-serif" },
        },
        overrides: {
          "3": { weight: 700, label: "Display" },
          "-1": { letterSpacing: 0.01 },
        },
        theme: "light",
      };
      expect(decodeConfig(encodeConfig(config))).toEqual(config);
    });
  });

  // Each test here takes a valid scale and breaks exactly one thing about
  // it, then checks that it gets correctly rejected.
  describe("malformed input returns null, never throws", () => {
    it("garbage string", () => {
      expect(decodeConfig("not-a-real-compressed-string!!")).toBeNull();
    });

    it("empty string", () => {
      expect(decodeConfig("")).toBeNull();
    });

    it("valid JSON, wrong shape entirely", () => {
      const encoded = compressToEncodedURIComponent(
        JSON.stringify({ foo: "bar" }),
      );
      expect(decodeConfig(encoded)).toBeNull();
    });

    it("valid shape, wrong version", () => {
      const encoded = compressToEncodedURIComponent(
        JSON.stringify({ ...initialEditorConfig, version: 2 }),
      );
      expect(decodeConfig(encoded)).toBeNull();
    });

    it("invalid literal union value: base.rounding", () => {
      const encoded = compressToEncodedURIComponent(
        JSON.stringify({
          ...initialEditorConfig,
          base: { ...initialEditorConfig.base, rounding: "bogus" },
        }),
      );
      expect(decodeConfig(encoded)).toBeNull();
    });

    it("invalid literal union value: theme", () => {
      const encoded = compressToEncodedURIComponent(
        JSON.stringify({ ...initialEditorConfig, theme: "purple" }),
      );
      expect(decodeConfig(encoded)).toBeNull();
    });

    it("invalid literal union value: fonts.heading.family (not one of the curated five)", () => {
      const encoded = compressToEncodedURIComponent(
        JSON.stringify({
          ...initialEditorConfig,
          fonts: {
            ...initialEditorConfig.fonts,
            heading: {
              ...initialEditorConfig.fonts.heading,
              family: "Comic Sans MS",
            },
          },
        }),
      );
      expect(decodeConfig(encoded)).toBeNull();
    });

    it("invalid literal union value: fonts.heading.fallback", () => {
      const encoded = compressToEncodedURIComponent(
        JSON.stringify({
          ...initialEditorConfig,
          fonts: {
            ...initialEditorConfig.fonts,
            heading: {
              ...initialEditorConfig.fonts.heading,
              fallback: "comic",
            },
          },
        }),
      );
      expect(decodeConfig(encoded)).toBeNull();
    });

    it("wrong type inside overrides", () => {
      const encoded = compressToEncodedURIComponent(
        JSON.stringify({
          ...initialEditorConfig,
          overrides: { "3": { weight: "seven" } },
        }),
      );
      expect(decodeConfig(encoded)).toBeNull();
    });

    it("truncated/corrupted compressed string", () => {
      const encoded = encodeConfig(initialEditorConfig);
      const truncated = encoded.slice(0, Math.floor(encoded.length / 2));
      expect(decodeConfig(truncated)).toBeNull();
    });

    // A grab-bag of odd, real-world things someone might accidentally
    // paste into a link, just to be sure none of them ever cause a crash.
    it("never throws across a batch of adversarial inputs", () => {
      const inputs = [
        "",
        " ",
        "null",
        "undefined",
        "{}",
        "🚀🚀🚀",
        "%%%",
        "a".repeat(5000),
      ];
      for (const input of inputs) {
        expect(() => decodeConfig(input)).not.toThrow();
      }
    });
  });
});
