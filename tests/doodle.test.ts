import { describe, expect, it } from "vitest";
import { doodleProblems, drawProgress, isVisible, wrapLines } from "../src/doodle-lib";
import type { DoodleVisual } from "../src/types";

const scene = (overrides: Partial<DoodleVisual> = {}): DoodleVisual => ({
  id: "s1",
  type: "doodle",
  title: "КРЕМЛЬ, 1941",
  items: [
    { kind: "person", id: "boss", at: 0, x: 0.3 },
    { kind: "say", at: 1, who: "boss", text: "ОГОНЬ!" },
  ],
  ...overrides,
});

describe("wrapLines", () => {
  it("breaks text on word boundaries within the limit", () => {
    expect(wrapLines("ТЫ СМОЖЕШЬ РАСКРОЙСЯ", 10)).toEqual(["ТЫ СМОЖЕШЬ", "РАСКРОЙСЯ"]);
  });

  it("keeps a word longer than the limit on its own line", () => {
    expect(wrapLines("ПСИХОЛОГИЧЕСКИЙ ИНСТИТУТ", 8)).toEqual(["ПСИХОЛОГИЧЕСКИЙ", "ИНСТИТУТ"]);
  });
});

describe("drawProgress", () => {
  it("is zero before the item appears", () => {
    expect(drawProgress({ frame: 10, at: 1 })).toBe(0);
  });

  it("is one once the draw-on animation has finished", () => {
    expect(drawProgress({ frame: 60, at: 1 })).toBe(1);
  });

  it("is between zero and one while drawing", () => {
    const value = drawProgress({ frame: 36, at: 1 });
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(1);
  });
});

describe("isVisible", () => {
  it("hides an item before its start and after its end", () => {
    expect(isVisible({ seconds: 0.5, at: 1 })).toBe(false);
    expect(isVisible({ seconds: 3, at: 1, until: 2 })).toBe(false);
    expect(isVisible({ seconds: 1.5, at: 1, until: 2 })).toBe(true);
  });
});

describe("doodleProblems", () => {
  it("accepts a well-formed scene", () => {
    expect(doodleProblems(scene())).toEqual([]);
  });

  it("reports a title longer than 36 characters", () => {
    expect(doodleProblems(scene({ title: "A".repeat(37) }))).toEqual([expect.stringContaining("title")]);
  });

  it("reports a speech bubble from an unknown person", () => {
    const problems = doodleProblems(scene({ items: [{ kind: "say", at: 1, who: "ghost", text: "ПРИВЕТ" }] }));
    expect(problems).toEqual([expect.stringContaining("ghost")]);
  });

  it("reports a speech bubble longer than 40 characters", () => {
    const items: DoodleVisual["items"] = [
      { kind: "person", id: "boss", at: 0, x: 0.3 },
      { kind: "say", at: 1, who: "boss", text: "A".repeat(41) },
    ];
    expect(doodleProblems(scene({ items }))).toEqual([expect.stringContaining("bubble")]);
  });
});
