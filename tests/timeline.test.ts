import { describe, expect, it } from "vitest";
import { narrations, type Episode } from "../src/episode";
import { buildTimeline } from "../src/timeline";
import type { HookText } from "../src/types";

const episodeWith = (hook: Partial<HookText> = {}): Episode => ({
  slug: "demo",
  lang: "ru",
  voiceId: "voice",
  hook: { text: "Ждал каплю и отошёл", accent: "отошёл", claims: [], ...hook },
  scenes: [
    { id: "start", type: "doodle", title: "НАЧАЛО", items: [], narration: "Тысяча девятьсот двадцать седьмой год.", labels: {}, claims: [] },
  ],
  outro: { text: "Ещё", narration: "Таких историй много." },
});

describe("hook in the video", () => {
  it("opens the reel with the hook by default", () => {
    expect(buildTimeline(episodeWith()).segments.map((segment) => segment.id)).toEqual(["hook", "start", "outro"]);
    expect(narrations(episodeWith()).map((entry) => entry.id)).toEqual(["hook", "start", "outro"]);
  });

  it("starts straight with the story when the hook is kept for the cover only", () => {
    const episode = episodeWith({ inVideo: false });
    expect(buildTimeline(episode).segments.map((segment) => segment.id)).toEqual(["start", "outro"]);
    expect(narrations(episode).map((entry) => entry.id)).toEqual(["start", "outro"]);
  });
});
