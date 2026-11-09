import { describe, expect, it } from "vitest";
import { propose } from "../scripts/propose";
import type { ProposalInput } from "../scripts/propose";

const video = (overrides: Partial<ProposalInput> = {}): ProposalInput => ({
  slug: "s",
  category: "history",
  avg_watch_pct: 0.5,
  shares_per_1k_reach: 50,
  hook: { words: 4, has_number: false, is_question: false },
  items_per_scene: 6,
  ...overrides,
});

const many = (count: number, overrides: Partial<ProposalInput>): ProposalInput[] =>
  Array.from({ length: count }, (_, index) => video({ slug: `${String(overrides.category ?? "x")}-${String(index)}`, ...overrides }));

describe("propose", () => {
  it("flags low retention on the hook even before lessons are allowed", () => {
    const result = propose({ videos: many(2, { avg_watch_pct: 0.2 }), lessonsAllowed: false });
    expect(result.map((p) => p.area)).toEqual(["hook"]);
    expect(result[0].evidence).toContain("20%");
  });

  it("says nothing while retention is healthy and lessons are not allowed", () => {
    expect(propose({ videos: many(5, { avg_watch_pct: 0.5 }), lessonsAllowed: false })).toEqual([]);
  });

  it("needs at least two scored videos for the retention alarm", () => {
    expect(propose({ videos: [video({ avg_watch_pct: 0.1 }), video({ avg_watch_pct: null })], lessonsAllowed: false })).toEqual([]);
  });

  it("moves weight to the category that gets shared more, with three videos on each side", () => {
    const videos = [...many(3, { category: "history", shares_per_1k_reach: 90 }), ...many(3, { category: "science", shares_per_1k_reach: 30 })];
    const topics = propose({ videos, lessonsAllowed: true }).find((p) => p.area === "topics");
    expect(topics?.change).toContain("history");
    expect(topics?.change).toContain("science");
    expect(topics?.metric).toBe("shares_per_1k_reach");
    expect(topics?.data).toEqual({ best: "history", worst: "science" });
  });

  it("ignores a category gap backed by fewer than three videos", () => {
    const videos = [...many(2, { category: "history", shares_per_1k_reach: 90 }), ...many(3, { category: "science", shares_per_1k_reach: 30 })];
    expect(propose({ videos, lessonsAllowed: true }).some((p) => p.area === "topics")).toBe(false);
  });

  it("proposes hooks with a number when they hold viewers longer", () => {
    const videos = [
      ...many(3, { category: "a", avg_watch_pct: 0.55, hook: { words: 4, has_number: true, is_question: false } }),
      ...many(3, { category: "b", avg_watch_pct: 0.4, hook: { words: 4, has_number: false, is_question: false } }),
    ];
    const hook = propose({ videos, lessonsAllowed: true }).find((p) => p.area === "hook");
    expect(hook?.change).toContain("цифр");
    expect(hook?.metric).toBe("avg_watch_pct");
  });

  it("proposes denser drawing when busier scenes hold viewers longer", () => {
    const videos = [...many(3, { category: "a", items_per_scene: 8, avg_watch_pct: 0.55 }), ...many(3, { category: "b", items_per_scene: 4, avg_watch_pct: 0.4 })];
    const visual = propose({ videos, lessonsAllowed: true }).find((p) => p.area === "visual");
    expect(visual?.change).toContain("больше");
  });

  it("ignores differences under five percentage points", () => {
    const videos = [...many(3, { category: "a", items_per_scene: 8, avg_watch_pct: 0.52 }), ...many(3, { category: "b", items_per_scene: 4, avg_watch_pct: 0.5 })];
    expect(propose({ videos, lessonsAllowed: true }).some((p) => p.area === "visual")).toBe(false);
  });

  it("returns at most three proposals, strongest first", () => {
    const videos = [
      ...many(3, { category: "a", avg_watch_pct: 0.1, shares_per_1k_reach: 90, items_per_scene: 8, hook: { words: 4, has_number: true, is_question: true } }),
      ...many(3, { category: "b", avg_watch_pct: 0.05, shares_per_1k_reach: 10, items_per_scene: 4, hook: { words: 4, has_number: false, is_question: false } }),
    ];
    const result = propose({ videos, lessonsAllowed: true });
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.strength)).toEqual([...result.map((p) => p.strength)].sort((a, b) => b - a));
  });
});
