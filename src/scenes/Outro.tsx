import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame } from "../Frame";
import type { SceneContext } from "../Frame";
import { INK, PENCIL, WavyLine } from "../Pencil";
import { Sfx } from "../Sfx";
import { theme } from "../theme";
import type { OutroText } from "../types";

type OutroProps = { outro: OutroText; context: SceneContext };

export const Outro = ({ outro, context }: OutroProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const underline = spring({ frame: frame - 14, fps, config: { damping: 20, stiffness: 90 } });

  return (
    <Frame context={context}>
      <Sfx name="chime" at={0} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: theme.spacing.page, opacity: enter, filter: PENCIL }}>
        <div
          style={{
            fontFamily: theme.fonts.title,
            fontWeight: 700,
            fontSize: 92,
            lineHeight: 1.15,
            textAlign: "center",
            color: INK,
            overflowWrap: "anywhere",
          }}
        >
          {outro.text}
        </div>
        <div style={{ marginTop: 56, fontFamily: theme.fonts.hand, fontSize: 60, color: theme.colors.accent }}>{context.handle}</div>
        <WavyLine width={520} progress={underline} />
      </AbsoluteFill>
    </Frame>
  );
};
