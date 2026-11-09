export type ProposalInput = {
  slug: string;
  category: string;
  avg_watch_pct: number | null;
  shares_per_1k_reach: number | null;
  hook: { words: number; has_number: boolean; is_question: boolean };
  items_per_scene: number;
};

export type ProposalMetric = "avg_watch_pct" | "shares_per_1k_reach";

export type Proposal = {
  area: "hook" | "topics" | "visual";
  change: string;
  evidence: string;
  expected: string;
  metric: ProposalMetric;
  strength: number;
  data?: { best: string; worst: string };
};

const LOW_RETENTION = 0.3;
const MIN_GROUP = 3;
const MIN_WATCH_GAP = 0.05;
const MIN_SHARE_GAP = 0.2;
const MAX_PROPOSALS = 3;

const mean = (numbers: number[]): number => numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
const pct = (value: number): string => `${String(Math.round(value * 100))}%`;
const watched = (videos: ProposalInput[]): number[] => videos.flatMap((v) => (v.avg_watch_pct === null ? [] : [v.avg_watch_pct]));

const retentionAlarm = (videos: ProposalInput[]): Proposal[] => {
  const values = watched(videos);
  const average = values.length >= 2 ? mean(values) : 1;
  return average < LOW_RETENTION
    ? [{
        area: "hook",
        change: "Переписать хук и первую сцену: зрители уходят в первой трети",
        evidence: `среднее удержание ${pct(average)} по ${String(values.length)} роликам (порог ${pct(LOW_RETENTION)})`,
        expected: "avg_watch_pct растёт",
        metric: "avg_watch_pct",
        strength: (LOW_RETENTION - average) / LOW_RETENTION,
      }]
    : [];
};

const splitWatch = (
  videos: ProposalInput[],
  test: (video: ProposalInput) => boolean,
): { yes: number; no: number } | undefined => {
  const yes = watched(videos.filter(test));
  const no = watched(videos.filter((video) => !test(video)));
  return yes.length >= MIN_GROUP && no.length >= MIN_GROUP ? { yes: mean(yes), no: mean(no) } : undefined;
};

const watchProposal = ({ videos, test, area, better, worse }: {
  videos: ProposalInput[];
  test: (video: ProposalInput) => boolean;
  area: Proposal["area"];
  better: string;
  worse: string;
}): Proposal[] => {
  const split = splitWatch(videos, test);
  if (!split || Math.abs(split.yes - split.no) < MIN_WATCH_GAP) return [];
  const wins = split.yes > split.no;
  return [{
    area,
    change: wins ? better : worse,
    evidence: `удержание ${pct(split.yes)} против ${pct(split.no)} (по ${String(MIN_GROUP)}+ ролика в группе)`,
    expected: "avg_watch_pct растёт",
    metric: "avg_watch_pct",
    strength: Math.abs(split.yes - split.no) / Math.max(split.yes, split.no),
  }];
};

const topicProposal = (videos: ProposalInput[]): Proposal[] => {
  const byCategory = [...new Set(videos.map((v) => v.category))]
    .map((category) => {
      const shares = videos.flatMap((v) => (v.category === category && v.shares_per_1k_reach !== null ? [v.shares_per_1k_reach] : []));
      return { category, shares };
    })
    .filter(({ shares }) => shares.length >= MIN_GROUP)
    .map(({ category, shares }) => ({ category, average: mean(shares) }))
    .sort((a, b) => b.average - a.average);
  const best = byCategory[0];
  const worst = byCategory.at(-1);
  if (!best || !worst || best === worst || best.average === 0) return [];
  const gap = (best.average - worst.average) / best.average;
  return gap < MIN_SHARE_GAP
    ? []
    : [{
        area: "topics",
        change: `Больше тем из «${best.category}», меньше из «${worst.category}» (исследование 20-30% сохраняется)`,
        evidence: `репосты на 1k охвата: ${best.average.toFixed(1)} против ${worst.average.toFixed(1)}`,
        expected: "shares_per_1k_reach растёт",
        metric: "shares_per_1k_reach",
        data: { best: best.category, worst: worst.category },
        strength: gap,
      }];
};

export const propose = ({ videos, lessonsAllowed }: { videos: ProposalInput[]; lessonsAllowed: boolean }): Proposal[] => {
  const itemsMedian = [...videos.map((v) => v.items_per_scene)].sort((a, b) => a - b)[Math.floor(videos.length / 2)] ?? 0;
  const lessons = lessonsAllowed
    ? [
        ...topicProposal(videos),
        ...watchProposal({ videos, area: "hook", test: (v) => v.hook.has_number, better: "Ставить цифру в хук", worse: "Убирать цифры из хука" }),
        ...watchProposal({ videos, area: "hook", test: (v) => v.hook.is_question, better: "Хук в форме вопроса", worse: "Хук утверждением, не вопросом" }),
        ...watchProposal({
          videos,
          area: "visual",
          test: (v) => v.items_per_scene >= itemsMedian,
          better: `Рисовать больше: от ${String(itemsMedian)} элементов на сцену`,
          worse: `Рисовать меньше: до ${String(itemsMedian)} элементов на сцену`,
        }),
      ]
    : [];
  return [...retentionAlarm(videos), ...lessons].sort((a, b) => b.strength - a.strength).slice(0, MAX_PROPOSALS);
};
