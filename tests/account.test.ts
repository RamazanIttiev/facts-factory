import { describe, expect, it } from "vitest";
import { accountSnapshot, followerGrowth } from "../scripts/account";

const insights = (pairs: Record<string, number>): unknown => ({
  data: Object.entries(pairs).map(([name, value]) => ({ name, period: "day", total_value: { value } })),
});

describe("accountSnapshot", () => {
  it("combines followers from the profile with totals from insights", () => {
    expect(
      accountSnapshot({
        profile: { followers_count: 120, media_count: 4 },
        insights: insights({ reach: 900, views: 2400, profile_views: 35, accounts_engaged: 60, total_interactions: 80 }),
        fetchedAt: "2026-11-09T06:00:00.000Z",
      }),
    ).toEqual({
      fetched_at: "2026-11-09T06:00:00.000Z",
      followers: 120,
      media: 4,
      reach: 900,
      views: 2400,
      profile_views: 35,
      accounts_engaged: 60,
      total_interactions: 80,
    });
  });

  it("keeps missing or malformed values as null", () => {
    const row = accountSnapshot({ profile: { error: "x" }, insights: { data: [{ name: "reach" }] }, fetchedAt: "t" });
    expect(row.followers).toBeNull();
    expect(row.reach).toBeNull();
    expect(row.views).toBeNull();
  });
});

describe("followerGrowth", () => {
  it("is the change in followers since the previous snapshot", () => {
    const rows = [
      { fetched_at: "a", followers: 100 },
      { fetched_at: "b", followers: 130 },
    ];
    expect(followerGrowth(rows)).toBe(30);
  });

  it("is null with fewer than two snapshots that have followers", () => {
    expect(followerGrowth([{ fetched_at: "a", followers: 100 }, { fetched_at: "b", followers: null }])).toBeNull();
  });
});
