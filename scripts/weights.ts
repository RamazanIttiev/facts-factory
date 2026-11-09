export type Weights = Record<string, number>;

const MAX_WEIGHT = 3;
const MIN_WEIGHT = 0.33;
const STEP = 1.5;
const WINDOW = 5;
const MIN_AFTER = 3;
const MIN_LIFT = 0.1;

const round = (value: number): number => Math.round(value * 100) / 100;
const clamp = (value: number): number => Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, round(value)));

export const weightedOrder = <T extends { id: number; category: string }>({ topics, counts, weights }: {
  topics: T[];
  counts: Map<string, number>;
  weights: Weights;
}): T[] => {
  const load = (topic: T): number => (counts.get(topic.category) ?? 0) / (weights[topic.category] ?? 1);
  return [...topics].sort((a, b) => load(a) - load(b) || a.id - b.id);
};

export const applyTopicChange = ({ weights, best, worst }: { weights: Weights; best: string; worst: string }): Weights => ({
  ...weights,
  [best]: clamp((weights[best] ?? 1) * STEP),
  [worst]: clamp((weights[worst] ?? 1) / STEP),
});

export type Verdict = "waiting" | "worked" | "rollback";
export type Comparison = { verdict: Verdict; before: number | null; after: number | null; n_before: number; n_after: number };

const mean = (numbers: number[]): number | null => (numbers.length ? round(numbers.reduce((s, n) => s + n, 0) / numbers.length) : null);

export const compareChange = ({ acceptedAt, points }: {
  acceptedAt: string;
  points: { published_at: string; value: number | null }[];
}): Comparison => {
  const at = new Date(acceptedAt).getTime();
  const measured = [...points]
    .filter((p): p is { published_at: string; value: number } => p.value !== null)
    .sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());
  const beforeValues = measured.filter((p) => new Date(p.published_at).getTime() < at).slice(-WINDOW).map((p) => p.value);
  const afterValues = measured.filter((p) => new Date(p.published_at).getTime() >= at).slice(0, WINDOW).map((p) => p.value);
  const before = mean(beforeValues);
  const after = mean(afterValues);
  const lifted = before !== null && after !== null && before > 0 && (after - before) / before >= MIN_LIFT;
  const verdict: Verdict =
    afterValues.length < MIN_AFTER ? "waiting" : lifted ? "worked" : afterValues.length >= WINDOW ? "rollback" : "waiting";
  return { verdict, before, after, n_before: beforeValues.length, n_after: afterValues.length };
};
