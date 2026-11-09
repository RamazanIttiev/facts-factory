const PREFIX = "(?:на|по|за|у|вы|от|об|объ|с|до|при|раз|рас|вз|под|пере|недо|про|ни|о)?";
const STEMS = "(?:хуй|хуе|хуё|хуя|хуи|пизд|бляд|блять|ебал|ебан|ёбан|ебат|ебну|ебуч|ебл|ебок|ебис|мудак|мудил|пидор|пидар|залуп|охрен)";
const EXACT = "(?:бля|хули|сука|суки|суке|суку|сукой|суками|сучар\\p{L}*|сучь\\p{L}*)";

const PROFANE = new RegExp(`^(?:${PREFIX}${STEMS}\\p{L}*|${EXACT})$`, "u");

const mask = (word: string): string => {
  const letters = Array.from(word);
  return word.length < 3 ? word : `${letters[0]}${"*".repeat(letters.length - 2)}${letters[letters.length - 1]}`;
};

export const maskProfanity = (text: string): string =>
  text.replace(/\p{L}+/gu, (word) => (PROFANE.test(word.toLowerCase()) ? mask(word) : word));

export const countProfanity = (text: string): number =>
  (text.match(/\p{L}+/gu) ?? []).filter((word) => PROFANE.test(word.toLowerCase())).length;
