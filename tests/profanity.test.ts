import { describe, expect, it } from "vitest";
import { maskProfanity } from "../src/profanity";

describe("maskProfanity", () => {
  it("keeps the first and last letter and stars the middle", () => {
    expect(maskProfanity("Это полный пиздец")).toBe("Это полный п****ц");
  });

  it("masks short words and keeps case and punctuation", () => {
    expect(maskProfanity("Блять, сука!")).toBe("Б***ь, с**а!");
  });

  it("masks words with common prefixes and the letter ё", () => {
    expect(maskProfanity("нахуй похуй охуеть ёбаный")).toBe("н***й п***й о****ь ё****й");
  });

  it("masks the colloquial 'охрененный' and its forms", () => {
    expect(maskProfanity("Охрененный план, охренеть")).toBe("О********й план, о******ь");
  });

  it("masks a standalone short interjection", () => {
    expect(maskProfanity("бля")).toBe("б*я");
  });

  it("masks the short slang word хули", () => {
    expect(maskProfanity("Хули там")).toBe("Х**и там");
  });

  it("leaves ordinary words that only look similar", () => {
    const text = "хуже хлеб употребление сукно требуй область небо";
    expect(maskProfanity(text)).toBe(text);
  });

  it("returns text without profanity unchanged", () => {
    expect(maskProfanity("Австралия против эму, 1932")).toBe("Австралия против эму, 1932");
  });
});
