import type { DoodleItem, Lang, Visual } from "../src/types";
import { countProfanity } from "../src/profanity";

export type EpisodeFeatures = {
  hook: { words: number; has_number: boolean; is_question: boolean };
  scenes: number;
  words: number;
  drawing: { items_per_scene: number; people_per_scene: number; say_share: number; thing_share: number };
  profanity: { count: number; first_scene: number | null };
};

const wordsOf = (text: string): number => text.split(/\s+/).filter(Boolean).length;

const share = (items: DoodleItem[], kind: DoodleItem["kind"]): number =>
  items.length === 0 ? 0 : items.filter((item) => item.kind === kind).length / items.length;

export const episodeFeatures = ({ visual, lang }: { visual: Visual; lang: Lang }): EpisodeFeatures => {
  const narrations = Object.values(lang.scenes).map((scene) => scene.narration);
  const items = visual.scenes.flatMap((scene) => (scene.type === "doodle" ? scene.items : []));
  const sceneCount = visual.scenes.length;
  const swears = narrations.map(countProfanity);
  const firstIndex = swears.findIndex((count) => count > 0);
  return {
    hook: { words: wordsOf(lang.hook.text), has_number: /\d/.test(lang.hook.text), is_question: lang.hook.text.trim().endsWith("?") },
    scenes: sceneCount,
    words: narrations.reduce((sum, text) => sum + wordsOf(text), 0),
    drawing: {
      items_per_scene: sceneCount === 0 ? 0 : items.length / sceneCount,
      people_per_scene: sceneCount === 0 ? 0 : items.filter((item) => item.kind === "person").length / sceneCount,
      say_share: share(items, "say"),
      thing_share: share(items, "thing"),
    },
    profanity: { count: swears.reduce((sum, count) => sum + count, 0), first_scene: firstIndex === -1 ? null : firstIndex + 1 },
  };
};
