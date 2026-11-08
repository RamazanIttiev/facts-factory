const PREFIX = "(?:на|по|за|у|вы|от|об|объ|с|до|при|раз|рас|вз|под|пере|недо|о)?";
const STEMS = "(?:хуй|хуе|хуё|хуя|хуи|пизд|бляд|блять|ебал|ебан|ёбан|ебат|ебну|ебуч|ебл|ебок|ебис|мудак|мудил|пидор|пидар|залуп)";
const EXACT = "(?:бля|хули|сука|суки|суке|суку|сукой|суками|сучар\\p{L}*|сучь\\p{L}*)";

const PROFANE = new RegExp(`^(?:${PREFIX}${STEMS}\\p{L}*|${EXACT})$`, "u");

const mask = (word: string): string => {
  const letters = Array.from(word);
  return word.length < 3 ? word : `${letters[0]}${"*".repeat(letters.length - 2)}${letters[letters.length - 1]}`;
};

export const maskProfanity = (text: string): string =>
  text.replace(/\p{L}+/gu, (word) => (PROFANE.test(word.toLowerCase()) ? mask(word) : word));
