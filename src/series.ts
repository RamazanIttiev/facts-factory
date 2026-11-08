export type Series = { name: string; handle: string; initials: string; avatar: string };

const SERIES: Record<string, Series> = {
  ru: { name: "facts-factory", handle: "@your_handle", initials: "FF", avatar: "avatar.jpg" },
  en: { name: "facts-factory", handle: "@your_handle", initials: "FF", avatar: "avatar.jpg" },
};

export const seriesFor = (lang: string): Series => SERIES[lang] ?? SERIES.ru;
