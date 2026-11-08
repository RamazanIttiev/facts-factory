import { loadFont as loadUnbounded } from "@remotion/google-fonts/Unbounded";
import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadNeucha } from "@remotion/google-fonts/Neucha";
import { loadFont as loadPtSans } from "@remotion/google-fonts/PTSans";

const subsets = ["cyrillic", "latin"] as const;

const heading = loadUnbounded("normal", { weights: ["700", "900"], subsets: [...subsets] });
const text = loadOnest("normal", { weights: ["400", "600"], subsets: [...subsets] });
const mono = loadMono("normal", { weights: ["500", "700"], subsets: [...subsets] });
const hand = loadNeucha("normal", { weights: ["400"], subsets: [...subsets] });
const title = loadPtSans("normal", { weights: ["700"], subsets: [...subsets] });

export const theme = {
  colors: {
    background: "#16181D",
    backgroundShade: "radial-gradient(ellipse 80% 60% at 50% 45%, rgb(46 50 60 / 0.55) 0%, rgb(22 24 29 / 0) 70%)",
    card: "rgba(8, 26, 46, 0.84)",
    cardBorder: "rgba(255, 255, 255, 0.22)",
    text: "#F1EEE6",
    muted: "#A9B7BF",
    accent: "#FFD166",
    keyword: "#8FD3FF",
    string: "#FFB38A",
    good: "#5BE38A",
    bad: "#FF5C6C",
    hot: "#FFD166",
    lime: "#C6F135",
    sun: "#FFC247",
  },
  fonts: {
    heading: heading.fontFamily,
    text: text.fontFamily,
    mono: mono.fontFamily,
    hand: hand.fontFamily,
    title: title.fontFamily,
  },
  spacing: { page: 100, gridCell: 60, radius: 36 },
} as const;
