import type { DoodleItem, DoodleVisual } from "./types";

export const FPS = 30;
export const DRAW_FRAMES = 12;
export const MAX_TITLE = 36;
export const MAX_BUBBLE = 40;

export const wrapLines = (text: string, limit: number): string[] =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .reduce<string[]>((lines, word) => {
      const last = lines[lines.length - 1];
      if (last === undefined) return [word];
      return `${last} ${word}`.length <= limit ? [...lines.slice(0, -1), `${last} ${word}`] : [...lines, word];
    }, []);

export const drawProgress = ({ frame, at }: { frame: number; at: number }): number => {
  const raw = Math.min(1, Math.max(0, (frame - at * FPS) / DRAW_FRAMES));
  return 1 - Math.pow(1 - raw, 3);
};

export const isVisible = ({ seconds, at, until }: { seconds: number; at: number; until?: number }): boolean =>
  seconds >= at && (until === undefined || seconds < until);

export const doodleEvents = (items: DoodleItem[]): number[] =>
  items.flatMap((item) => [item.at, ...(item.until !== undefined ? [item.until] : [])]);

export const doodleProblems = (scene: DoodleVisual): string[] => {
  const tag = `scene "${scene.id}"`;
  const people = new Set(scene.items.flatMap((item) => (item.kind === "person" ? [item.id] : [])));
  return [
    ...(scene.title.length > MAX_TITLE ? [`${tag}: title ${scene.title.length} chars, max ${MAX_TITLE}`] : []),
    ...scene.items.flatMap((item) => {
      if (item.kind !== "say") return [];
      return [
        ...(people.has(item.who) ? [] : [`${tag}: bubble from unknown person "${item.who}"`]),
        ...(item.text.length > MAX_BUBBLE ? [`${tag}: bubble "${item.text.slice(0, 16)}…" over ${MAX_BUBBLE} chars`] : []),
      ];
    }),
  ];
};
