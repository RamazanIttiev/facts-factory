import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame } from "../Frame";
import type { SceneContext } from "../Frame";
import { Glyph } from "../HookIcon";
import { circlePath, HEIGHT, INK, PENCIL, WIDTH } from "../Pencil";
import { maskProfanity } from "../profanity";
import { Sfx } from "../Sfx";
import { theme } from "../theme";
import type { HookText } from "../types";

type HookProps = { hook: HookText; context: SceneContext };

const CENTER_X = WIDTH / 2;
const CENTER_Y = 1110;
const MAIN_RADIUS = 190;
const ORBIT_RADIUS = 400;
const ORBIT_CIRCLE = 66;
const BURST_LINES = 14;
const TITLE_WIDTH = 880;
const MAX_TITLE_FONT = 150;
const CHAR_WIDTH_EM = 0.7;
const WORD_STAGGER = 4;

const titleFont = (text: string): number => {
  const longest = Math.max(...text.split(/\s+/).map((word) => word.length));
  return Math.min(MAX_TITLE_FONT, Math.floor(TITLE_WIDTH / (longest * CHAR_WIDTH_EM)));
};

const Word = ({ text, index, accent }: { text: string; index: number; accent: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const land = spring({ frame: frame - index * WORD_STAGGER, fps, config: { damping: 9, stiffness: 260 } });
  return (
    <span
      style={{
        display: "inline-block",
        color: accent ? theme.colors.accent : INK,
        opacity: index === 0 ? 1 : Math.min(1, land * 3),
        transform: `scale(${1.7 - 0.7 * land}) translateY(${(1 - land) * -30}px)`,
      }}
    >
      {text}
    </span>
  );
};

const stroke = { stroke: INK, strokeLinecap: "round", fill: "none" } as const;

const Burst = ({ progress }: { progress: number }) => (
  <g>
    {Array.from({ length: BURST_LINES }, (_, index) => {
      const angle = (index / BURST_LINES) * Math.PI * 2;
      const from = MAIN_RADIUS + 36;
      const to = from + (index % 2 === 0 ? 62 : 36);
      const reach = from + (to - from) * progress;
      return (
        <line
          key={index}
          x1={CENTER_X + Math.cos(angle) * from}
          y1={CENTER_Y + Math.sin(angle) * from}
          x2={CENTER_X + Math.cos(angle) * reach}
          y2={CENTER_Y + Math.sin(angle) * reach}
          strokeWidth={5}
          {...stroke}
        />
      );
    })}
  </g>
);

const Orbiter = ({ icon, index, count }: { icon: string; index: number; count: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 4 - index * 4, fps, config: { damping: 12, stiffness: 160 } });
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2 + frame / 70;
  const x = CENTER_X + Math.cos(angle) * ORBIT_RADIUS;
  const y = CENTER_Y + Math.sin(angle) * ORBIT_RADIUS * 0.82;
  const glyph = ORBIT_CIRCLE * 1.05;
  return (
    <g transform={`translate(${x} ${y}) scale(${enter})`}>
      <path d={circlePath(0, 0, ORBIT_CIRCLE)} strokeWidth={5} {...stroke} fill={theme.colors.background} />
      <g transform={`translate(${-glyph / 2} ${-glyph / 2})`}>
        <Glyph name={icon} size={glyph} color={INK} stroke={1.8} />
      </g>
    </g>
  );
};

export const Hook = ({ hook, context }: HookProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const burst = spring({ frame: frame - 6, fps, config: { damping: 12, stiffness: 150 } });
  const zoom = interpolate(frame, [0, context.duration], [1, 1.05], { extrapolateRight: "clamp" });
  const words = maskProfanity(hook.text).split(/\s+/).filter(Boolean);
  const accentWords = hook.accent.split(/\s+/);
  const isAccent = (word: string): boolean => accentWords.some((part) => word.includes(part));
  const orbit = hook.orbit ?? [];
  const fontSize = titleFont(hook.text);
  const glyph = MAIN_RADIUS * 1.15;

  return (
    <Frame context={context}>
      <Sfx name="thud" at={0} />
      <div
        style={{
          position: "absolute",
          top: 240,
          left: theme.spacing.page,
          right: theme.spacing.page,
          display: "flex",
          zIndex: 2,
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: fontSize * 0.28,
          fontFamily: theme.fonts.title,
          fontWeight: 700,
          fontSize,
          lineHeight: 1.1,
          textTransform: "uppercase",
        }}
      >
        {words.map((word, index) => (
          <Word key={index} text={word} index={index} accent={isAccent(word)} />
        ))}
      </div>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}>
        <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <g filter={PENCIL}>
            <Burst progress={burst} />
            <path d={circlePath(CENTER_X, CENTER_Y, MAIN_RADIUS)} strokeWidth={7} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} {...stroke} fill={theme.colors.background} />
            <path d={circlePath(CENTER_X + 4, CENTER_Y - 3, MAIN_RADIUS - 14)} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} {...stroke} />
            <g transform={`translate(${CENTER_X - glyph / 2} ${CENTER_Y - glyph / 2})`} opacity={draw}>
              <Glyph name={hook.icon ?? "zap"} size={glyph} color={INK} stroke={1.6} />
            </g>
            {orbit.map((icon, index) => (
              <Orbiter key={`${icon}-${index}`} icon={icon} index={index} count={orbit.length} />
            ))}
          </g>
        </svg>
      </AbsoluteFill>
    </Frame>
  );
};
