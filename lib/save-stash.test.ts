import { describe, expect, it, vi } from "vitest";
import { parsePendingSave, serializePendingSave } from "./save-stash";
import { initialEditorConfig } from "./editor-reducer";

describe("save-stash", () => {
  it("round-trips a config through serialize + parse", () => {
    expect(parsePendingSave(serializePendingSave(initialEditorConfig))).toEqual(initialEditorConfig);
  });

  it("returns null for null/missing input", () => {
    expect(parsePendingSave(null)).toBeNull();
  });

  it("returns null for garbage input, never throws", () => {
    expect(() => parsePendingSave("not json")).not.toThrow();
    expect(parsePendingSave("not json")).toBeNull();
  });

  it("returns null for valid JSON with the wrong shape", () => {
    expect(parsePendingSave(JSON.stringify({ foo: "bar" }))).toBeNull();
  });

  it("returns null once the stash is older than 30 minutes", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValueOnce(now); // used by serializePendingSave
    const stashed = serializePendingSave(initialEditorConfig);

    vi.spyOn(Date, "now").mockReturnValueOnce(now + 31 * 60 * 1000); // used by parsePendingSave
    expect(parsePendingSave(stashed)).toBeNull();

    vi.restoreAllMocks();
  });

  it("still returns the config when read well within the 30 minute window", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValueOnce(now);
    const stashed = serializePendingSave(initialEditorConfig);

    vi.spyOn(Date, "now").mockReturnValueOnce(now + 5 * 60 * 1000);
    expect(parsePendingSave(stashed)).toEqual(initialEditorConfig);

    vi.restoreAllMocks();
  });
});
