import { Fragment } from "react";
import { AbsoluteFill } from "remotion";
import { Avatar, INK, PENCIL, PencilDefs } from "./Pencil";
import { HookIcon } from "./HookIcon";
import { theme } from "./theme";
import type { HookText } from "./types";

export type CoverProps = { hook: HookText; handle: string; avatar: string };

export const Cover = ({ hook, handle, avatar }: CoverProps) => {
  const parts = hook.text.split(hook.accent);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.background,
        backgroundImage: theme.colors.backgroundShade,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing.page,
        gap: 90,
      }}
    >
      <PencilDefs />
      <div style={{ display: "flex", alignItems: "center", gap: 28, filter: PENCIL }}>
        <Avatar size={140} />
        <div style={{ fontFamily: theme.fonts.hand, fontSize: 56, color: INK }}>{handle}</div>
      </div>
      <HookIcon name={hook.icon} size={320} />
      <div
        style={{
          fontFamily: theme.fonts.title,
          fontWeight: 700,
          fontSize: 140,
          lineHeight: 1.18,
          textAlign: "center",
          color: INK,
          overflowWrap: "anywhere",
        }}
      >
        {parts.map((part, index) => (
          <Fragment key={index}>
            {part}
            {index < parts.length - 1 && <span style={{ color: theme.colors.accent }}>{hook.accent}</span>}
          </Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
};
