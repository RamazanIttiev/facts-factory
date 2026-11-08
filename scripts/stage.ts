import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { parseArgs } from "node:util";
import { loadEnv } from "./env";
import { loadQueue, setState } from "./queue";
import { pullQueue, pushQueue } from "./queue-sync";
import { putFile, r2Configured, readyCoverKey, readyVideoKey } from "./r2";

const TELEGRAM_LIMIT_BYTES = 49 * 1024 * 1024;

const { values, positionals } = parseArgs({ allowPositionals: true, options: { lang: { type: "string" } } });
const lang = values.lang ?? "ru";
const slug = positionals[0];
if (!slug) {
  console.error("Usage: npm run stage -- <slug> [--lang ru]");
  process.exit(1);
}
loadEnv();

const video = `out/${slug}.${lang}.mp4`;
const cover = `covers/${slug}.${lang}.jpg`;
if (!existsSync(video)) {
  console.error(`${video} not found. Render first: npm run render -- ${slug} --lang ${lang}`);
  process.exit(1);
}
if (!existsSync(cover)) spawnSync("npx", ["tsx", "scripts/cover.ts", slug, "--lang", lang], { stdio: "inherit" });
if (!r2Configured()) {
  console.error("R2 is not configured");
  process.exit(1);
}

await pullQueue(lang);
await putFile(readyVideoKey(slug, lang), video, "video/mp4");
if (existsSync(cover)) await putFile(readyCoverKey(slug, lang), cover, "image/jpeg");
if (!loadQueue(lang).some((item) => item.slug === slug)) {
  console.error(`${slug} is not in the queue: run npm run ready -- ${slug} first`);
  process.exit(1);
}
setState(lang, slug, "awaiting_approval", "rendered locally, video in R2, waiting for the owner");
await pushQueue(lang);
console.log(`uploaded ${slug} to R2, state awaiting_approval`);

const token = process.env.TELEGRAM_BOT_TOKEN;
const chat = process.env.TELEGRAM_CHAT_ID;
if (!token || !chat) {
  console.log("telegram is not configured, nothing sent");
  process.exit(0);
}
const caption = `${slug}\nОдобрить: напиши «одобряю ${slug}» или присылай правки.`;
const size = statSync(video).size;
const send = async (): Promise<Response> => {
  if (size > TELEGRAM_LIMIT_BYTES) {
    return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: `${caption}\n(видео ${(size / 1048576).toFixed(0)} МБ, больше лимита Telegram: ${video}, копия в R2)` }),
    });
  }
  const form = new FormData();
  form.append("chat_id", chat);
  form.append("caption", caption);
  form.append("supports_streaming", "true");
  form.append("video", new Blob([readFileSync(video)], { type: "video/mp4" }), `${slug}.mp4`);
  return fetch(`https://api.telegram.org/bot${token}/sendVideo`, { method: "POST", body: form });
};
const response = await send();
console.log(response.ok ? "sent to telegram" : `telegram failed: HTTP ${response.status}`);
process.exit(response.ok ? 0 : 1);
