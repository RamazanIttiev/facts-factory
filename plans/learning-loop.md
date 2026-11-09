# Learning loop: every 5 days

Goal: every 5 days, collect the stats and turn them into concrete changes: which topics come next, how hooks are written, how dense the drawing is. The owner approves every change.

## What already exists (copied from reels-factory)
- `scripts/metrics.ts`: Graph API snapshots (reach, views, likes, comments, shares, saved, avg/total watch time) at 24/72/168 h, saved to `state/<lang>/metrics.jsonl`.
- `scripts/scoring.ts`: composite score as a percentile in the trailing window (`config/experiment.json`).
- `scripts/analyze.ts`: bootstrap comparison by category, hook_type, kind, level, post_slot and visual. Lessons are blocked in the explore phase.
- `scripts/next.ts`: picks the next topic (balanced rotation, then exploit/explore).
- `scripts/alert.ts`: Telegram. `.github/workflows/check.yml`: cron every 6 h.
- Not built: tracking of episode format features, the 5-day cycle, change proposals, and applying them.

## Cycle (cron `0 6 */5 * *`, GitHub Actions `learn.yml`)
1. **Collect**: `npm run metrics -- --lang ru`. This takes snapshots of everything that reached its 24/72/168 h window. Plus an account snapshot (followers, profile_views) in `state/ru/account.jsonl`.
2. **Features**: new `scripts/features.ts` measures each published episode from its JSON, with no manual tagging:
   - hook: word count, form (question / contradiction / number), whether there is a number, `hook_type`;
   - length: seconds and words; scene count; words per scene;
   - drawing: items per second, people per scene, share of `say` and of `thing`, average gap between events;
   - profanity: count, and seconds to the first swear;
   - topic: category, era, country, kind.
   Saved to `state/ru/features.jsonl`.
3. **Analysis**: `npm run analyze` on scores × features. Main targets:
   - `avg_watch_pct` (watch time / length) → hook, length, drawing rhythm;
   - `shares_per_1k_reach`, `saves_per_1k_reach` → topic, punchline;
   - `reach` relative to followers → topic, hook (did it get into recommendations).
   A difference counts only if the bootstrap 90% CI does not cross 0 and each group has at least 3 videos. Otherwise it is "an observation, not a lesson".
4. **Proposals**: new `scripts/propose.ts` writes `state/ru/proposals/<date>.md` + `.json`, with at most 3 changes per cycle (one variable at a time, so the effect stays readable). Types:
   - `topics`: reweight categories in `next.ts` (best +, worst −), keep the 20–30% exploration share; reorder `plan/topics.json` and suggest 3 new topics in the winning category;
   - `hook`: a rule in `state/lessons.md` ("a hook with a number beats a question: +X pp watch") + rewrite the hooks of queued episodes that are not rendered yet;
   - `visual`: change the density norms (items per scene, rhythm threshold in `layout`), or add/remove a prop or look in `Doodle.tsx` (only as a task to do via TDD, never automatically);
   - `format`: target length, posting slot.
   Each proposal states: the evidence (numbers, n, CI), the change, and which metric we expect to move.
5. **Approval**: a Telegram message with a short summary + a link to the proposals PR. The owner answers yes/no on each item. Accepted changes go into `state/lessons.md` / `config/topic-weights.json` / topics, and the queue gets updated. Nothing in `config/rules.json` or the tone rules changes automatically.
6. **Check against the past**: each accepted change is tagged in `state/ru/changes.jsonl` (date, what, expected effect). The next cycle compares the 5 episodes after the change with the 5 before it. If the effect did not show up, propose a rollback.

## Phases (from `config/experiment.json`)
- Fewer than 10 videos (now **2**, owner's decision 2026-11-09): explore. The cycle collects and reports, and only proposes topic rotation and obvious things (for example, drop-off before the 3rd second → the hook). No lessons about hook_type or drawing.
- 11–80: learn, lessons allowed.
- 80+: exploit 80/20.
Honestly: after 10 videos, lessons are allowed but the samples are small (2–4 per group): treat them as hypotheses and test each with a before/after comparison. Before that, the cycle mostly gathers data and protects against noise.

## What the API does not give, and how to fill the gap
Retention by second and the skip rate exist only in the app. Option: once every 5 days the owner sends the screenshot of the retention graph for new reels to Telegram (or drops it in `state/ru/retention/<slug>.png`); the analysis reads off the drop-off point and links it to the scene → which scene loses people.

## Implementation order (TDD, separate PRs)
1. `features.ts` + tests (pure functions over episode JSON).
2. `account` snapshots in `metrics.ts`.
3. `propose.ts`: rules from analyze to proposals, tests on synthetic data.
4. `config/topic-weights.json` support in `next.ts`.
5. `learn.yml` cron + Telegram summary + PR with proposals.
6. `changes.jsonl` and the before/after check.
