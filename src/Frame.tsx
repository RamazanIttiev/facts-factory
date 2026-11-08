import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Avatar, INK, PENCIL, PencilDefs } from "./Pencil";
import { autoTimes, FPS, sweepAt } from "./rhythm";
import { theme } from "./theme";
import type { Tone } from "./types";

export type SceneContext = { step: number; total: number; duration: number; handle: string; avatar: string; events?: number[] };

export const toneColor = (tone: Tone | undefined): string =>
  tone === "bad" ? theme.colors.bad : tone === "good" ? theme.colors.good : theme.colors.cardBorder;

type FrameProps = { context: SceneContext; children: ReactNode };

const SWEEP_TOP = 300;
const SWEEP_TRAVEL = 1100;

const Rhythm = ({ context }: { context: SceneContext }) => {
  const frame = useCurrentFrame();
  const progress = sweepAt(frame / FPS, autoTimes(context.events ?? [], context.duration / FPS));
  if (progress === undefined) return null;
  const eased = 1 - Math.pow(1 - progress, 3);
  const y = SWEEP_TOP + eased * SWEEP_TRAVEL;
  const fade = Math.sin(progress * Math.PI);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 4 }}>
      <div style={{ position: "absolute", left: 60, right: 60, top: y, height: 3, borderRadius: 3, opacity: 0.22 * fade, background: `linear-gradient(90deg, transparent, ${INK}, transparent)` }} />
    </AbsoluteFill>
  );
};

const SceneEntry = ({ children, flash }: { children: ReactNode; flash: boolean }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ transform: `translateY(${(1 - enter) * 40}px) scale(${1.03 - 0.03 * enter})` }}>
      {children}
      {flash && <AbsoluteFill style={{ background: INK, opacity: interpolate(frame, [0, 7], [0.1, 0], { extrapolateRight: "clamp" }), pointerEvents: "none" }} />}
    </AbsoluteFill>
  );
};

export const Frame = ({ context, children }: FrameProps) => (
  <AbsoluteFill style={{ backgroundColor: theme.colors.background, backgroundImage: theme.colors.backgroundShade }}>
    <PencilDefs />
    <SceneEntry flash={context.step > 0}>
      <div
        style={{
          position: "absolute",
          top: 60,
          left: theme.spacing.page,
          right: theme.spacing.page,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          filter: PENCIL,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Avatar size={68} />
          <div style={{ fontFamily: theme.fonts.hand, fontSize: 40, color: INK }}>{context.handle}</div>
        </div>
        {context.step > 0 && (
          <div
            style={{
              fontFamily: theme.fonts.hand,
              fontSize: 40,
              color: INK,
              border: `3.5px solid ${INK}`,
              borderRadius: 20,
              padding: "2px 24px",
            }}
          >
            {context.step}/{context.total}
          </div>
        )}
      </div>
      {children}
      <Rhythm context={context} />
    </SceneEntry>
  </AbsoluteFill>
);
