import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import type { Proposal } from "./propose";
import { appendJsonl, isRecord, readJsonl, stateDir } from "./state";
import { applyTopicChange } from "./weights";
import type { Weights } from "./weights";

export const WEIGHTS_PATH = "config/topic-weights.json";

export const loadWeights = (lang: string): Weights => {
  if (!existsSync(WEIGHTS_PATH)) return {};
  const raw: unknown = JSON.parse(readFileSync(WEIGHTS_PATH, "utf8"));
  const forLang = isRecord(raw) && isRecord(raw[lang]) ? raw[lang] : {};
  return Object.fromEntries(Object.entries(forLang).filter((entry): entry is [string, number] => typeof entry[1] === "number"));
};

export type ChangeRecord = Proposal & { id: string; accepted_at: string };

export const changesPath = (lang: string): string => `${stateDir(lang)}/changes.jsonl`;

export const readChanges = (lang: string): ChangeRecord[] =>
  readJsonl(changesPath(lang)).filter((row): row is ChangeRecord => isRecord(row) && typeof row.id === "string" && typeof row.accepted_at === "string" && typeof row.metric === "string");

const isMain = process.argv[1]?.endsWith("accept.ts") ?? false;

if (isMain) {
  const { values, positionals } = parseArgs({ options: { lang: { type: "string" } }, allowPositionals: true });
  const lang = values.lang ?? "ru";
  const [date, numbers] = positionals;
  if (!date || !numbers) {
    console.error("Usage: accept <YYYY-MM-DD> <n[,n]> --lang ru");
    process.exit(1);
  }
  const proposals: unknown = JSON.parse(readFileSync(`${stateDir(lang)}/proposals/${date}.json`, "utf8"));
  const list = Array.isArray(proposals) ? proposals.filter((p): p is Proposal => isRecord(p) && typeof p.change === "string") : [];
  const already = new Set(readChanges(lang).map((change) => change.id));
  numbers.split(",").map(Number).forEach((n) => {
    const proposal = list[n - 1];
    const id = `${date}#${String(n)}`;
    if (!proposal) throw new Error(`No proposal ${id}`);
    if (already.has(id)) return console.log(`${id} already accepted`);
    appendJsonl(changesPath(lang), { ...proposal, id, accepted_at: new Date().toISOString() });
    if (proposal.area === "topics" && proposal.data) {
      const all: unknown = existsSync(WEIGHTS_PATH) ? JSON.parse(readFileSync(WEIGHTS_PATH, "utf8")) : {};
      const next = { ...(isRecord(all) ? all : {}), [lang]: applyTopicChange({ weights: loadWeights(lang), ...proposal.data }) };
      writeFileSync(WEIGHTS_PATH, `${JSON.stringify(next, null, 2)}\n`);
      console.log(`${id}: weights ${JSON.stringify(next[lang])}`);
      return;
    }
    console.log(`${id} accepted: ${proposal.change}${proposal.area === "topics" ? "" : " (apply it in lessons/episodes by hand or ask Claude)"}`);
  });
}
