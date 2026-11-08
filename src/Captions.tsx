import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { INK } from "./Pencil";
import { maskProfanity } from "./profanity";
import { theme } from "./theme";
import type { TimedWord } from "./timeline";

type CaptionsProps = { words: TimedWord[] };

const MAX_FONT_SIZE = 150;
const MAX_TEXT_WIDTH = 940;
const CHAR_WIDTH_EM = 0.68;

const displayText = (text: string): string => text.replace(/[.,!?;:]+$/, "").toUpperCase();

export const Captions = ({ words }: CaptionsProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = words.find((word) => frame >= word.from && frame < word.to);

  if (!active) return null;

  const label = displayText(maskProfanity(active.text));
  const fontSize = Math.min(MAX_FONT_SIZE, Math.floor(MAX_TEXT_WIDTH / (label.length * CHAR_WIDTH_EM)));
  const pop = spring({ frame: frame - active.from, fps, config: { damping: 10, stiffness: 200 } });

  return (
    <div
      style={{
        position: "absolute",
        left: theme.spacing.page,
        right: theme.spacing.page,
        top: 1490,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${0.8 + 0.2 * pop})`,
          fontFamily: theme.fonts.title,
          fontWeight: 700,
          fontSize,
          letterSpacing: 2,
          textAlign: "center",
          color: active.accent ? theme.colors.accent : INK,
          textShadow: `0 5px 0 ${theme.colors.background}, 0 0 20px ${theme.colors.background}`,
        }}
      >
        {label}
      </div>
    </div>
  );
};
