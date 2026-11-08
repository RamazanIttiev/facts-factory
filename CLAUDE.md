# facts-factory

Pipeline for 60-120s vertical reels (9:16, 1080x1920, 30fps) rendered from code: true stories, facts and surprising topics told in a funny-but-serious voice with profanity (мат), drawn as chalk/pencil doodles on a dark background.
Owner: Ramazan (Russian-speaking). Reel language: Russian. Reply to the owner in Russian, briefly.
Second account, not education. Engine copied from `reels-factory`; the two repos are independent, port engine fixes by hand. Local only for now (no remote).

## Core principle: code once, data forever
A new reel = ONE new JSON pair in `episodes/<slug>/` (`visual.ru.json` + `ru.json`). Never edit components, theme or scripts to produce an episode.
If a drawing is missing (person look, prop), add it once in `src/scenes/Doodle.tsx` + `src/types.ts` and document it below.

## Token rules (highest priority)
1. Never read: `node_modules/`, `out/`, `.cache/`, `public/audio/`, `*.mp4`, `*.wav`, `.env`.
2. Never watch a full video. Check a render with max 3 frames: `npm run frames -- <slug> --lang ru --ids <id1>,<id2>,<id3>` (ids are scene ids, `hook` or `outro`), read only those PNGs from `frames/`.
3. Trim command output: `| tail -20`.
4. Preview cheap, render once: `npm run preview -- <slug> --lang ru`; full render only after the owner approves frames.
5. TTS audio and timings are cached in `.cache/` by content hash. Do not regenerate if text and voice are unchanged.
6. Do not re-read files you just wrote, do not re-explain the plan. Finish with: result + file path + one next step.
7. Prefer small Edits. Use Grep/Glob before opening files. Read big files with offset/limit.
8. Delegate to subagents only when the owner asks.

## Tone and profanity
- Voice: a smart friend telling a wild true story over a beer. Joking, but the facts are serious and exact. Short sentences, one idea each, each term explained once.
- Мат is seasoning that lands on telling details and reactions. Owner asked for MORE (2026-11-08, after the first episode): 5-8 swear words per episode, spread across scenes, 1-2 per scene at most, never in the hook or caption. Mild words (хрен, охренеть) count half.
- Direct the swearing at situations, decisions, institutions, bureaucracy, "the system". Never at private individuals, never at protected groups (ethnicity, religion, gender, orientation, disability), never at tragedy victims. Real people are described by what they did, per the sources.
- Humor never changes a fact. A joke may exaggerate the reaction, never the event.
- Platform risk: Instagram and TikTok cut reach and monetization for explicit profanity, mostly in the first seconds, the on-screen text and the post text. Defaults until the owner decides otherwise:
  - the hook (first 3 spoken words and its on-screen text) is clean;
  - `caption` (post text) is clean;
  - мат lives in narration and speech bubbles.
- Decided by the owner: profanity is voiced in full but masked on screen (`б***ь`). `src/profanity.ts` `maskProfanity` is applied to captions, bubbles, signs, titles and hook; the list is a stem heuristic, extend it when a new word slips through (add a test first).
- Amount: more than the first episode (5-8 per episode). Still aimed at situations, decisions and institutions, never at people or groups; no mat in the hook or caption; the joke never changes a fact.
- TTS: compare voices on one swearing phrase before choosing a `voiceId` (many voices soften or garble мат). `voiceId` in the template is a leftover from the first account.

## Architecture
```
plan/topics.json           topic list with status per language
config/                    COPIED from the first account (rules, sources, experiment, schedule): not adapted yet, do not trust their content
episodes/<slug>/visual.<lang>.json   scenes: id, type "doodle", title, items
episodes/<slug>/<lang>.json          hook, narration per scene id, caption, outro, voiceId, claims
episodes/_template/        old template (diagram/code/checklist), not for doodle; copy episodes/doodle-demo instead
facts/<slug>.json          fact sheet: claims with exact quotes and dates (scripts/facts.ts)
state/<lang>/              learning loop records (created on first record)
src/                       Reel, Frame (header), Captions, Hook, Outro, Cover, Pencil (filter, avatar), scenes/Doodle.tsx, doodle-lib.ts (pure helpers)
scripts/                   render, frames, check-words, layout, verify, publish, tts, timings ... same as the first account
tests/doodle.test.ts       tests for wrapLines, drawProgress, isVisible, doodleProblems
```
Old scene types (`diagram`, `code`, `checklist`, `browser`, `media`, `custom`) still exist in the engine but doodle is the default for this account.

## Visual style
Dark charcoal paper (`#16181D`), chalk-white line (`#F1EEE6`), one accent: warm yellow `#FFD166` (hook accent word, caption accent, handle). No other colors.
All ink goes through one SVG filter (`#pencil` in `src/Pencil.tsx`): wobble that re-seeds every 3 frames (hand-drawn boil) plus graphite grain. Lines draw on in 12 frames. Text is still after it appears (entrance only).
Fonts: PT Sans Bold (titles, captions, hook), Neucha (handwriting: bubbles, labels, handle). Both support Cyrillic.
Header: drawn smiley avatar, handle from env `CHANNEL_HANDLE` (name `CHANNEL_NAME`), read in `src/series.ts`; never hardcode it, step pill `n/N`.

## Doodle scene (`type: "doodle"`)
`visual.<lang>.json` scene: `{ id, type: "doodle", title, items: [...] }`. `title` max 36 chars, caps on screen, top of the frame. Each item has `at` (seconds from scene start, about 2.9 words per second, anchor it to the moment the matching word is spoken: render a preview with audio first, read the real word times, then place `at`. Real speech runs about 2.4-2.6 words per second with the current voice) and optional `until` (item disappears).
Stage: `x` is 0..1 across the page margins. Ground line at y=1260, people stand on it. Captions sit at y=1490.
- `person {id, x, face?: "left"|"right", look?: ["glasses","mustache","tie","spikes","cap","pipe"], mood?: "smile"|"flat"|"open"|"angry"|"sad", arm?: "down"|"point"|"up", label?}` label is written under the feet ("ТЫ", "ДИРЕКТОР"). `id` must be unique per scene.
- `say {who, text, dx?, lift?}` speech bubble above the person `who`, max 40 chars (14 per line). `dx` shifts sideways, `lift` raises it so it does not cover props.
- `thing {name, x, y?, scale?, text?, sub?, lines?}`: `desk`, `window`, `picture`, `book` (text, sub), `building` (text on the banner), `money`, `chart`, `trophy`, `calendar` (text big, sub small), `phone` (lines = chat bubbles alternating left/right), `sign` (framed text). `y` lifts it above the ground (window, picture, chart, calendar, sign hang on the wall by default).
Plan 4-8 items per scene, 2-3 people at most, one action per scene. Bubbles replace each other with `until`.
Rhythm: an `at`/`until` event at least every 2.5 s of speech (doodle only; other scene types keep 1.5 s). `npm run layout` uses the real audio durations from `.cache/props` when the preview was rendered with audio, otherwise an estimate; it fails on longer gaps and says where. Keep bubbles and props from overlapping: move with `dx`, `lift`, `x`.
Hook (`ru.json`): up to 6 words, `accent` = the word in yellow, `icon` + `orbit` (3 icons) from the set in `src/hookIcons.ts` (tech-only for now, extend it once for general topics).

## Episode workflow
1. Pick a topic from `plan/topics.json` (add real ones first). `npm run next -- --lang ru` once config is adapted.
2. `npm run facts -- <slug>`: primary sources, claims with exact quotes. The story must be true; dates, names and numbers in the text must occur in the quotes.
3. Write `visual.ru.json` + `ru.json` (copy `episodes/doodle-demo`), claims on the hook and every scene.
4. `npm run layout -- <slug> --lang ru`, `npm run check -- <slug>`, `npm run verify -- <slug> --lang ru`, then the `double-check` skill as the meaning pass. `npm run status -- <slug> ru drafted`.
5. `npm run preview -- <slug> --lang ru`, then 3 frames, fix overlaps.
6. After the owner approves: `npm run render -- <slug> --lang ru`.
7. `npm run publish` only on the owner's explicit command; none of the publishing credentials of this account are set up yet.

## Storytelling (a story, not a list of facts)
Every episode is ONE story with a spine. Before writing, answer in one line each: who wants what (stakes), what absurd or bold thing they do, what goes wrong (escalation, 2-3 beats), the twist that changes how we see it, and what it means now (a punchline that turns to "you" or to the system).
- Hook: a question or contradiction that the video answers later (the answer is a real fact from the sources, not an invention).
- Scenes: one idea each; every scene must move the plot (new problem, new reversal or new consequence). Drop any fact that does not carry the plot, even a funny one.
- Pick the 3-5 strongest facts (a number, a quote, a contradiction) and build around them; the rest is context in half a sentence.
- Say why it matters in plain words once; no definitions the viewer did not ask for.
- Length: 60-120 s, 150-285 words (`config/rules.json` in this repo is adapted; the first account's 50-60 s does not apply). Slow voice: about 2.4 words per second.
- Check: read the narration aloud as one text. If a friend asks "so what?" after any scene, rewrite that scene.

### Connected story (owner asked, 2026-11-08)
1. Spine first, facts second. Before `npm run facts`, write `episodes/<slug>/spine.md`: one sentence "X wanted Y, BUT Z, SO W, BUT then V, and it means U". If you need "and also" to say it, it is a list, not a story: pick another angle or topic.
2. Collect facts for the spine, not about the topic. Search for: the hero's motive (why they did it), the cause between beats (why each event led to the next), the price (a number for the stakes), one direct quote, and what happened after. In `facts/<slug>.json` each claim serves one beat; a claim that serves no beat is dropped.
3. One hero, from the hook to the end. Name them in scene 1 and keep the same `person` id and `look` in every scene where they appear. A second character comes in only as an obstacle or an ally to the hero.
4. "But / so" between scenes, never "and". Scene N+1 opens as a consequence of scene N: "и тогда", "но", "поэтому", "а дальше хуже". If two scenes can swap places without breaking the story, they are not connected: merge them or drop one.
5. Setup and payoff. The hook asks a question; the twist scene answers it out loud. A detail, number or prop shown early must come back later (a callback); one that never comes back gets cut. The punchline points back to the hook.
6. Time runs forward. Chronological order; a flashback only when it is the twist.
7. Rising stakes. Each beat costs more than the last (money, people, reputation, time). Say the price as a number when the sources give one.
8. Visual continuity. Props and people that carry over between scenes keep their name, `x` side and look, so the viewer reads one world, not separate slides.
9. Before writing the JSON, check the spine against the scene list: every scene is one beat of the spine sentence, in that order.

## Content rules
- One concrete story or fact per reel, with a date and a name. Structure: hook (the absurd or surprising point) -> context in 2-3 short scenes -> the twist -> a punchline that turns to "you".
- Facts via the fact gate; round numbers honestly ("около"); no "всегда/никогда/все/лучший" without grounds.
- Write everything from scratch; do not retell other channels or articles.
- No health, legal or financial advice; no claims about living private people; crime and tragedy topics are told through documented facts, with attribution ("по данным...").
- Word budget: `npm run check` (150-285 words for 60-120 s).
- Outro: a soft line tied to the topic, never an imperative, never the same phrase twice in a row. The outro screen shows the handle.

## Commands
- `npm run studio` Remotion studio (opens `doodle-demo`, set in `src/Root.tsx`)
- `npm run preview -- <slug> --lang ru`, `npm run frames -- <slug> --lang ru --ids a,b,c`, `npm run render -- <slug> --lang ru`
- `npm run layout -- <slug> --lang ru`, `npm run check -- <slug>`, `npm run verify -- <slug> --lang ru`, `npm run typecheck`
- `npx vitest run` tests
- `npm run publish:dry -- <slug> --lang ru` dry run only; `npm run publish` ASK THE OWNER FIRST

## Not done yet (do not pretend otherwise)
- Real handle, avatar, channel name, accounts, API keys, R2, Meta app.
- `config/*`, `plan/taxonomy.json` and the scheduler/learning loop are from the first account.
- General-purpose hook icons, TTS voice choice, the profanity-on-screen decision above.
- No git commits yet, no remote.

## External services (keys in `.env`, never read or print)
TTS: `TTS_PROVIDER` (default `mock` = silence). AI-generated content must be labeled as AI on Meta/TikTok. If the network is blocked, say so once and ask the owner to run the command.

## Definition of done for an episode
1. JSON valid, `layout` and `check` pass, claims verified.
2. 3 frames reviewed, no overlap or overflow on 1080x1920.
3. Final mp4 in `out/`, 50-60s, audio and captions in sync.
4. Reply: file path, duration, one suggestion. Nothing else.
