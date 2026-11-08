export type Series = { name: string; handle: string; initials: string; avatar: string };

const fromEnv = (name: string, fallback: string): string => {
  const value = typeof process === "undefined" ? undefined : process.env[name];
  return value && value.trim() ? value.trim() : fallback;
};

const channelName = (): string => fromEnv("CHANNEL_NAME", "facts-factory");

const channelHandle = (): string => {
  const raw = fromEnv("CHANNEL_HANDLE", `@${channelName()}`);
  return raw.startsWith("@") ? raw : `@${raw}`;
};

export const seriesFor = (_lang: string): Series => ({
  name: channelName(),
  handle: channelHandle(),
  initials: channelName().slice(0, 2).toUpperCase(),
  avatar: "logo.jpg",
});
