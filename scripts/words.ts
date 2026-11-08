import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

const FPS = 30;
const { values, positionals } = parseArgs({ allowPositionals: true, options: { lang: { type: "string" } } });
const slug = positionals[0];
const lang = values.lang ?? "ru";
if (!slug) {
  console.error("Usage: npm run words -- <slug> [--lang ru]  (needs a preview rendered with audio)");
  process.exit(1);
}

type Word = { text: string; from: number };
type Segment = { id: string; duration: number; words: Word[] };

const props: unknown = JSON.parse(readFileSync(`.cache/props/${slug}.${lang}.json`, "utf8"));
const segments: Segment[] = typeof props === "object" && props !== null && "segments" in props && Array.isArray(props.segments) ? props.segments : [];

segments.forEach((segment) => {
  const words = segment.words.map((word, index) => `${index + 1}.${word.text.replace(/[^\p{L}\p{N}-]/gu, "").toLowerCase()}@${(word.from / FPS).toFixed(1)}`);
  console.log(`# ${segment.id} duration ${(segment.duration / FPS).toFixed(1)}s\n${words.join(" ")}\n`);
});
