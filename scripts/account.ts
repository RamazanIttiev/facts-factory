import { isRecord } from "./state";

export const ACCOUNT_METRICS = ["reach", "views", "profile_views", "accounts_engaged", "total_interactions"];

export type AccountRow = { fetched_at: string; followers: number | null; [key: string]: unknown };

const numberOr = (value: unknown): number | null => (typeof value === "number" ? value : null);

const totalOf = (insights: unknown, name: string): number | null => {
  const data = isRecord(insights) && Array.isArray(insights.data) ? insights.data : [];
  const entry: unknown = data.find((item: unknown) => isRecord(item) && item.name === name);
  return isRecord(entry) && isRecord(entry.total_value) ? numberOr(entry.total_value.value) : null;
};

export const accountSnapshot = ({ profile, insights, fetchedAt }: { profile: unknown; insights: unknown; fetchedAt: string }): AccountRow => ({
  fetched_at: fetchedAt,
  followers: isRecord(profile) ? numberOr(profile.followers_count) : null,
  media: isRecord(profile) ? numberOr(profile.media_count) : null,
  ...Object.fromEntries(ACCOUNT_METRICS.map((name) => [name, totalOf(insights, name)])),
});

export const followerGrowth = (rows: AccountRow[]): number | null => {
  const counts = rows.map((row) => row.followers).filter((value): value is number => value !== null);
  return counts.length < 2 ? null : counts[counts.length - 1] - counts[counts.length - 2];
};
