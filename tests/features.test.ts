import { describe, expect, it } from "vitest";
import { episodeFeatures } from "../scripts/features";
import type { DoodleItem, Lang, Visual } from "../src/types";

const lang = (overrides: Partial<Lang> = {}): Lang => ({
  lang: "ru",
  voiceId: "v",
  caption: "c",
  hook: { text: "Из-за вони перестроили Лондон", accent: "вони", claims: [] },
  scenes: {
    a: { narration: "Раз два три четыре. Пиздец какой.", claims: [] },
    b: { narration: "Пять шесть семь восемь.", claims: [] },
  },
  outro: { text: "o", narration: "Конец." },
  ...overrides,
});

const person: DoodleItem = { kind: "person", id: "p", at: 0, x: 0.5 };
const say: DoodleItem = { kind: "say", at: 2, who: "p", text: "Э", until: 4 };
const sign: DoodleItem = { kind: "thing", at: 6, name: "sign", x: 0.5, text: "Х" };

const visual = (): Visual => ({
  slug: "s",
  scenes: [
    { id: "a", type: "doodle", title: "A", items: [person, say, sign] },
    { id: "b", type: "doodle", title: "B", items: [person] },
  ],
});

describe("episodeFeatures", () => {
  it("describes the hook: word count, number and question form", () => {
    expect(episodeFeatures({ visual: visual(), lang: lang() }).hook).toEqual({ words: 4, has_number: false, is_question: false });
    const asked = lang({ hook: { text: "Почему 1858 воняло?", accent: "1858", claims: [] } });
    expect(episodeFeatures({ visual: visual(), lang: asked }).hook).toEqual({ words: 3, has_number: true, is_question: true });
  });

  it("counts scenes and narration words", () => {
    const features = episodeFeatures({ visual: visual(), lang: lang() });
    expect(features.scenes).toBe(2);
    expect(features.words).toBe(10);
  });

  it("measures drawing density per scene", () => {
    expect(episodeFeatures({ visual: visual(), lang: lang() }).drawing).toEqual({
      items_per_scene: 2,
      people_per_scene: 1,
      say_share: 0.25,
      thing_share: 0.25,
    });
  });

  it("reports zero density for an episode without scenes", () => {
    expect(episodeFeatures({ visual: { slug: "s", scenes: [] }, lang: lang() }).drawing).toEqual({
      items_per_scene: 0,
      people_per_scene: 0,
      say_share: 0,
      thing_share: 0,
    });
  });

  it("treats a hook ending with a question mark and trailing space as a question", () => {
    const asked = lang({ hook: { text: "Зачем? ", accent: "Зачем", claims: [] } });
    expect(episodeFeatures({ visual: visual(), lang: asked }).hook.is_question).toBe(true);
  });

  it("counts swear words and the scene where the first one lands", () => {
    expect(episodeFeatures({ visual: visual(), lang: lang() }).profanity).toEqual({ count: 1, first_scene: 1 });
    const clean = lang({ scenes: { a: { narration: "Чисто.", claims: [] } } });
    expect(episodeFeatures({ visual: visual(), lang: clean }).profanity).toEqual({ count: 0, first_scene: null });
  });
});
