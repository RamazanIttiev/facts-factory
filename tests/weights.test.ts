import { describe, expect, it } from "vitest";
import { applyTopicChange, compareChange, weightedOrder } from "../scripts/weights";

const topic = (id: number, category: string) => ({ id, category });

describe("weightedOrder", () => {
  it("picks the category with the fewest videos when weights are equal", () => {
    const order = weightedOrder({ topics: [topic(1, "a"), topic(2, "b")], counts: new Map([["a", 2], ["b", 1]]), weights: {} });
    expect(order.map((t) => t.id)).toEqual([2, 1]);
  });

  it("lets a weight of 2 earn twice as many videos before yielding", () => {
    const counts = new Map([["a", 3], ["b", 2]]);
    expect(weightedOrder({ topics: [topic(1, "a"), topic(2, "b")], counts, weights: { a: 2 } }).map((t) => t.id)).toEqual([1, 2]);
  });

  it("keeps id order inside one category", () => {
    expect(weightedOrder({ topics: [topic(5, "a"), topic(3, "a")], counts: new Map(), weights: {} }).map((t) => t.id)).toEqual([3, 5]);
  });
});

describe("applyTopicChange", () => {
  it("raises the best category and lowers the worst, without mutating", () => {
    const before = { a: 1 };
    expect(applyTopicChange({ weights: before, best: "a", worst: "b" })).toEqual({ a: 1.5, b: 0.67 });
    expect(before).toEqual({ a: 1 });
  });

  it("caps weights so exploration never stops", () => {
    expect(applyTopicChange({ weights: { a: 2.8, b: 0.4 }, best: "a", worst: "b" })).toEqual({ a: 3, b: 0.33 });
  });
});

const point = (day: number, value: number | null) => ({ published_at: `2026-12-${String(day).padStart(2, "0")}T10:00:00Z`, value });

describe("compareChange", () => {
  it("waits until three videos are published after the change", () => {
    expect(compareChange({ acceptedAt: "2026-12-10T00:00:00Z", points: [point(1, 0.3), point(11, 0.5)] }).verdict).toBe("waiting");
  });

  it("calls it worked when the after mean beats before by 10 percent", () => {
    const points = [point(1, 0.3), point(2, 0.3), point(11, 0.4), point(12, 0.4), point(13, 0.4)];
    expect(compareChange({ acceptedAt: "2026-12-10T00:00:00Z", points })).toEqual({ verdict: "worked", before: 0.3, after: 0.4, n_before: 2, n_after: 3 });
  });

  it("suggests a rollback after five videos without the effect", () => {
    const points = [point(1, 0.4), ...[11, 12, 13, 14, 15].map((d) => point(d, 0.41))];
    expect(compareChange({ acceptedAt: "2026-12-10T00:00:00Z", points }).verdict).toBe("rollback");
  });

  it("keeps waiting between three and five videos without the effect", () => {
    const points = [point(1, 0.4), ...[11, 12, 13].map((d) => point(d, 0.4))];
    expect(compareChange({ acceptedAt: "2026-12-10T00:00:00Z", points }).verdict).toBe("waiting");
  });

  it("uses only the five closest videos on each side and skips unmeasured ones", () => {
    const points = [point(1, 0.9), ...[2, 3, 4, 5, 6].map((d) => point(d, 0.3)), point(7, null), ...[11, 12, 13].map((d) => point(d, 0.4))];
    const result = compareChange({ acceptedAt: "2026-12-10T00:00:00Z", points });
    expect(result.before).toBe(0.3);
    expect(result.n_before).toBe(5);
  });
});
