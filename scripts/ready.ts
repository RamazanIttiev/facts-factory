import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { upsert } from "./queue";
import { pushQueue, pushReviewAssets } from "./queue-sync";
import { isRecord } from "./state";
import { findTopic, loadTopics } from "./topics";

const { values, positionals } = parseArgs({ allowPositionals: true, options: { lang: { type: "string" } } });
const lang = values.lang ?? "ru";
const slug = positionals[0];
if (!slug) {
  console.error("Usage: npm run ready -- <slug> [--lang ru]");
  process.exit(1);
}

const run = (args: string[]): { ok: boolean; output: string } => {
  const result = spawnSync("npm", ["run", "-s", ...args], { encoding: "utf8", env: { ...process.env, TTS_PROVIDER: process.env.TTS_PROVIDER ?? "mock" } });
  return { ok: result.status === 0, output: `${result.stdout}${result.stderr}`.trim() };
};

const verify = run(["verify", "--", slug, "--lang", lang]);
const words = run(["check", "--", slug, "--lang", lang]);
const layout = run(["layout", "--", slug, "--lang", lang]);
const gateOk = verify.ok && layout.ok && !words.output.includes("WARN");
if (!gateOk) {
  console.error(`GATE FAILED for ${slug}\n${[verify, words, layout].map((step) => step.output).join("\n").split("\n").slice(-25).join("\n")}`);
  process.exit(1);
}

const rules: unknown = JSON.parse(readFileSync("config/rules.json", "utf8"));
const publishing = isRecord(rules) && isRecord(rules.publishing) ? rules.publishing : {};
const topic = findTopic(loadTopics(), slug);
if (!topic) {
  console.error(`${slug} is not in plan/topics.json`);
  process.exit(1);
}
const topicFlags: Record<string, unknown> = { ...topic };
const flagged = Array.isArray(publishing.always_require_human_approval_tags) && publishing.always_require_human_approval_tags.some((tag) => topicFlags[String(tag)] === true);
const auto = publishing.mode === "auto" && !flagged;

run(["status", "--", slug, lang, "drafted"]);
upsert(lang, { slug, category: topic.category, hook_type: topic.hook_type, state: auto ? "approved" : "awaiting_approval", ...(auto ? { note: "auto-approved: gate passed" } : {}) });
await pushQueue(lang);
if (!auto) await pushReviewAssets(lang, slug);
console.log(`${auto ? "AUTO-APPROVED" : "AWAITING APPROVAL"}: ${slug}`);
