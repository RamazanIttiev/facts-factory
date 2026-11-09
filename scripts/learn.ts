import { mkdirSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { readChanges } from "./accept";
import { sendAlert } from "./alert";
import { loadExperiment, phaseFor } from "./experiment";
import { episodeFeatures } from "./features";
import { loadLang, loadVisual } from "./load-episode";
import { propose } from "./propose";
import type { Proposal, ProposalInput } from "./propose";
import { latestRow, readMetrics } from "./scoring";
import type { MetricRow } from "./scoring";
import { appendJsonl, readVideos, stateDir } from "./state";
import { compareChange } from "./weights";

const { values } = parseArgs({ options: { lang: { type: "string" }, "no-alert": { type: "boolean" } } });
const lang = values.lang ?? "ru";
const experiment = loadExperiment();
const videos = readVideos(lang);
const rows = readMetrics(lang);
const phase = phaseFor(experiment, videos.length + 1);

const numberAt = (row: MetricRow | undefined, key: string): number | null => {
  const value = row?.[key];
  return typeof value === "number" ? value : null;
};

const inputs: ProposalInput[] = videos.map((video) => {
  const features = episodeFeatures({ visual: loadVisual(video.slug, lang), lang: loadLang(video.slug, lang) });
  const row = latestRow(rows, video.video_id, [24, 72, 168]);
  appendJsonl(`${stateDir(lang)}/features.jsonl`, { video_id: video.video_id, at: new Date().toISOString(), ...features });
  return {
    slug: video.slug,
    category: video.category,
    avg_watch_pct: numberAt(row, "avg_watch_pct"),
    shares_per_1k_reach: numberAt(row, "shares_per_1k_reach"),
    hook: features.hook,
    items_per_scene: features.drawing.items_per_scene,
  };
});

const proposals = propose({ videos: inputs, lessonsAllowed: phase.lessons_allowed });
const date = new Date().toISOString().slice(0, 10);
const scored = inputs.filter((input) => input.avg_watch_pct !== null).length;
const line = (p: Proposal, index: number): string => `${String(index + 1)}. [${p.area}] ${p.change}\n   данные: ${p.evidence}\n   ждём: ${p.expected}`;
const VERDICT = { waiting: "ждём данных", worked: "сработало", rollback: "эффекта нет, предлагаю откатить" };
const checks = readChanges(lang).map((change) => {
  const points = videos.map((video) => ({
    published_at: video.published_at,
    value: numberAt(latestRow(rows, video.video_id, [24, 72, 168]), change.metric),
  }));
  const result = compareChange({ acceptedAt: change.accepted_at, points });
  const show = (value: number | null): string => (value === null ? "n/a" : String(value));
  return `- ${change.id} «${change.change}»: ${change.metric} до ${show(result.before)} (n=${String(result.n_before)}), после ${show(result.after)} (n=${String(result.n_after)}) — ${VERDICT[result.verdict]}`;
});

const report = [
  `# Предложения ${date} (${lang})`,
  `Роликов: ${String(videos.length)}, с метриками: ${String(scored)}, фаза: ${phase.name}${phase.lessons_allowed ? "" : " (выводы ещё не разрешены, только тревоги)"}.`,
  "",
  proposals.length ? proposals.map(line).join("\n") : "Изменений не предлагаю: данных мало или всё в норме.",
  "",
  ...(checks.length ? ["", "Принятые изменения, до/после:", ...checks] : []),
  "",
  `Принять: npm run accept -- ${date} 1,2 --lang ru. Ничего не применяется без твоего да.`,
].join("\n");

mkdirSync(`${stateDir(lang)}/proposals`, { recursive: true });
writeFileSync(`${stateDir(lang)}/proposals/${date}.md`, `${report}\n`);
writeFileSync(`${stateDir(lang)}/proposals/${date}.json`, `${JSON.stringify(proposals, null, 2)}\n`);
console.log(report);
if (!values["no-alert"]) await sendAlert(lang, report);
