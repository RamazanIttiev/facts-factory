import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { ResolvedScene } from "../episode";
import { drawProgress, FPS, isVisible, wrapLines } from "../doodle-lib";
import { Frame } from "../Frame";
import type { SceneContext } from "../Frame";
import { PENCIL } from "../Pencil";
import { maskProfanity } from "../profanity";
import { theme } from "../theme";
import type { DoodleItem, DoodleLook } from "../types";

type DoodleProps = { scene: Extract<ResolvedScene, { type: "doodle" }>; context: SceneContext };
type PersonItem = Extract<DoodleItem, { kind: "person" }>;
type SayItem = Extract<DoodleItem, { kind: "say" }>;
type ThingItem = Extract<DoodleItem, { kind: "thing" }>;

const INK = "#F1EEE6";
const PAPER = theme.colors.background;
const GROUND = 1260;
const STROKE = 4.5;
const WIDTH = 1080;
const HEIGHT = 1920;
const MARGIN = 60;
const HEAD_TOP = 370;

const stageX = (fraction: number): number => MARGIN + fraction * (WIDTH - 2 * MARGIN);

const Ink = ({ d, p, fill, width = STROKE }: { d: string; p: number; fill?: "paper" | "ink"; width?: number }) => (
  <path
    d={d}
    pathLength={1}
    strokeDasharray="1 1"
    strokeDashoffset={1 - p}
    stroke={INK}
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
    fill={fill === "ink" ? INK : fill === "paper" ? PAPER : "none"}
    fillOpacity={fill ? p : 0}
  />
);

type ScribbleProps = { lines: string[]; x: number; y: number; size: number; p: number; family?: string; weight?: number; anchor?: "middle" | "start" };

const Scribble = ({ lines, x, y, size, p, family = theme.fonts.hand, weight = 400, anchor = "middle" }: ScribbleProps) => (
  <g opacity={p} transform={`translate(0 ${(1 - p) * 10})`}>
    {lines.map((line, index) => (
      <text key={index} x={x} y={y + index * size * 1.12} fill={INK} fontFamily={family} fontSize={size} fontWeight={weight} textAnchor={anchor}>
        {maskProfanity(line)}
      </text>
    ))}
  </g>
);

const circle = (cx: number, cy: number, r: number): string => `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;

const BODY = "M -42 -232 C -52 -150 -56 -70 -50 -12 L -50 0 L -10 0 L -10 -14 Q 0 -22 10 -14 L 10 0 L 50 0 L 50 -12 C 56 -70 52 -150 42 -232";
const HEAD_Y = -285;

const ARMS: Record<NonNullable<PersonItem["arm"]>, string[]> = {
  down: ["M -46 -205 Q -78 -150 -64 -100", "M 46 -205 Q 78 -150 64 -100"],
  point: ["M -46 -205 Q -78 -150 -64 -100", "M 46 -205 Q 120 -218 200 -200"],
  up: ["M -46 -205 Q -78 -150 -64 -100", "M 46 -205 Q 92 -262 80 -340"],
};

const MOUTHS: Record<NonNullable<PersonItem["mood"]>, string[]> = {
  smile: ["M -16 -262 Q 0 -246 16 -262"],
  flat: ["M -14 -258 L 14 -258"],
  open: [circle(0, -256, 10)],
  angry: ["M -14 -258 L 14 -258", "M -30 -318 L -8 -306", "M 30 -318 L 8 -306"],
  sad: ["M -14 -252 Q 0 -266 14 -252"],
};

const LOOKS: Record<DoodleLook, { d: string; fill?: "paper" | "ink" }[]> = {
  glasses: [{ d: circle(-20, -290, 17) }, { d: circle(20, -290, 17) }, { d: "M -3 -290 L 3 -290" }],
  mustache: [{ d: "M -32 -262 Q -16 -280 0 -267 Q 16 -280 32 -262 Q 16 -256 0 -261 Q -16 -256 -32 -262 Z", fill: "ink" }],
  tie: [{ d: "M 0 -232 L -10 -214 L 0 -150 L 10 -214 Z", fill: "ink" }],
  spikes: [{ d: "M -38 -330 L -30 -366 L -14 -338 L 0 -372 L 14 -338 L 30 -366 L 38 -330" }],
  cap: [{ d: "M -57 -300 Q -52 -356 0 -356 Q 52 -356 57 -300 Z", fill: "paper" }, { d: "M 57 -300 L 96 -296" }],
  pipe: [{ d: "M 8 -254 L 52 -254" }, { d: "M 52 -264 L 66 -264 L 66 -244 L 52 -244 Z", fill: "paper" }],
};

const Person = ({ item, p }: { item: PersonItem; p: number }) => {
  const flip = item.face === "left" ? -1 : 1;
  const arms = ARMS[item.arm ?? "down"];
  const mouth = MOUTHS[item.mood ?? "smile"];
  return (
    <g transform={`translate(${stageX(item.x)} ${GROUND})`}>
      <g transform={`scale(${flip} 1)`}>
        {arms.map((d) => (
          <Ink key={d} d={d} p={p} />
        ))}
        <Ink d={BODY} p={p} fill="paper" />
        <Ink d={circle(0, HEAD_Y, 55)} p={p} fill="paper" />
        <circle cx={-17} cy={-292} r={5.5} fill={INK} opacity={p} />
        <circle cx={17} cy={-292} r={5.5} fill={INK} opacity={p} />
        {mouth.map((d) => (
          <Ink key={d} d={d} p={p} />
        ))}
        {(item.look ?? []).flatMap((look) => LOOKS[look].map((part) => <Ink key={`${look}${part.d}`} d={part.d} p={p} fill={part.fill} />))}
      </g>
      {item.label && <Scribble lines={wrapLines(item.label, 18)} x={0} y={52} size={30} p={p} />}
    </g>
  );
};

const gridWindows = (cols: number, rows: number, cell: number): string =>
  Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => `M ${-170 + 22 + col * cell} ${-390 + 40 + row * 86} h 30 v 48 h -30 Z`).join(" "),
  ).join(" ");

const ThingArt = ({ item, p }: { item: ThingItem; p: number }) => {
  const text = item.text ?? "";
  const sub = item.sub ?? "";
  if (item.name === "desk")
    return (
      <>
        <Ink d="M -150 -150 L 150 -150" p={p} />
        <Ink d="M -138 -150 L -138 0 M 138 -150 L 138 0" p={p} />
        <Ink d="M 20 -150 L 20 -64 L 120 -64 L 120 -150 M 55 -108 L 85 -108" p={p} />
      </>
    );
  if (item.name === "window")
    return (
      <>
        <Ink d="M -100 -130 h 200 v 260 h -200 Z M 0 -130 v 260 M -70 50 L -30 -40" p={p} fill="paper" />
        <Ink d="M -112 -142 h 224 v 284 h -224 Z" p={p} />
      </>
    );
  if (item.name === "picture")
    return (
      <>
        <Ink d="M -100 -70 h 200 v 140 h -200 Z" p={p} fill="paper" />
        <Ink d="M -80 50 L -30 -10 L 0 25 L 30 -20 L 80 50 M 40 -42 a 8 8 0 1 0 0.1 0" p={p} />
      </>
    );
  if (item.name === "book")
    return (
      <>
        <Ink d="M -95 -260 h 190 v 260 h -190 Z" p={p} fill="paper" />
        <Ink d="M -95 -260 h 26 v 260 h -26 Z" p={p} fill="ink" />
        <Scribble lines={wrapLines(text, 8)} x={14} y={-150} size={34} p={p} family={theme.fonts.title} weight={700} />
        <Scribble lines={[sub]} x={14} y={-40} size={32} p={p} family={theme.fonts.title} weight={700} />
      </>
    );
  if (item.name === "building")
    return (
      <>
        <Ink d="M -170 0 V -390 H 170 V 0" p={p} fill="paper" />
        <Ink d={gridWindows(6, 4, 56)} p={p} />
        <Ink d="M -30 0 V -80 H 30 V 0" p={p} />
        <Ink d="M -200 -390 H 200 V -470 H -200 Z" p={p} fill="paper" />
        <Scribble lines={wrapLines(text, 20)} x={0} y={-422} size={32} p={p} family={theme.fonts.title} weight={700} />
      </>
    );
  if (item.name === "money")
    return (
      <>
        <Ink d="M -45 0 C -85 -30 -72 -110 -25 -125 L -36 -152 L 36 -152 L 25 -125 C 72 -110 85 -30 45 0 Z" p={p} fill="paper" />
        <Scribble lines={["$"]} x={0} y={-45} size={64} p={p} family={theme.fonts.title} weight={700} />
      </>
    );
  if (item.name === "chart")
    return (
      <>
        <Ink d="M -130 -110 h 260 v 220 h -260 Z" p={p} fill="paper" />
        <Ink d="M -100 90 V 20 h 36 V 90 M -44 90 V -20 h 36 V 90 M 12 90 V -50 h 36 V 90 M 68 90 V -80 h 36 V 90" p={p} />
      </>
    );
  if (item.name === "trophy")
    return (
      <>
        <Ink d="M -52 -170 H 52 C 52 -100 22 -76 0 -76 C -22 -76 -52 -100 -52 -170 Z" p={p} fill="paper" />
        <Ink d="M -52 -150 C -92 -150 -92 -100 -42 -100 M 52 -150 C 92 -150 92 -100 42 -100 M 0 -76 V -44 M -32 -44 H 32 L 26 -18 H -26 Z" p={p} />
      </>
    );
  if (item.name === "calendar")
    return (
      <>
        <Ink d="M -80 -80 h 160 v 170 h -160 Z M -50 -92 v 24 M 50 -92 v 24" p={p} fill="paper" />
        <Scribble lines={[sub]} x={0} y={-40} size={26} p={p} family={theme.fonts.title} weight={700} />
        <Scribble lines={[text]} x={0} y={30} size={54} p={p} family={theme.fonts.title} weight={700} />
      </>
    );
  if (item.name === "phone")
    return (
      <>
        <Ink d="M -125 -230 h 250 v 460 h -250 Z" p={p} fill="paper" />
        <Ink d="M -112 -218 h 224 v 436 h -224 Z" p={p} />
        {(item.lines ?? []).map((line, index) => {
          const right = index % 2 === 1;
          const width = Math.min(200, line.length * 14 + 28);
          const x = right ? 100 - width : -100;
          const y = -190 + index * 74;
          return (
            <g key={line}>
              <Ink d={`M ${x} ${y} h ${width} v 50 h ${-width} Z`} p={p} />
              <Scribble lines={[line]} x={x + width / 2} y={y + 34} size={24} p={p} />
            </g>
          );
        })}
      </>
    );
  if (item.name === "camera")
    return (
      <>
        <Ink d="M 0 -110 L -45 0 M 0 -110 L 45 0 M 0 -110 L 0 0" p={p} />
        <Ink d="M -47 -212 a 22 22 0 1 0 44 0 a 22 22 0 1 0 -44 0 M 3 -212 a 22 22 0 1 0 44 0 a 22 22 0 1 0 -44 0" p={p} fill="paper" />
        <Ink d="M -55 -190 h 110 v 70 h -110 Z" p={p} fill="paper" />
        <Ink d="M 55 -175 L 95 -192 L 95 -118 L 55 -135 Z" p={p} fill="paper" />
      </>
    );
  if (item.name === "truck")
    return (
      <>
        <Ink d="M -150 -40 L -150 -150 L 20 -150 L 20 -40 Z" p={p} fill="paper" />
        <Ink d="M 20 -40 L 20 -110 L 70 -110 L 100 -70 L 100 -40 Z" p={p} fill="paper" />
        <Ink d="M -120 -30 a 30 30 0 1 0 60 0 a 30 30 0 1 0 -60 0 M 30 -30 a 30 30 0 1 0 60 0 a 30 30 0 1 0 -60 0" p={p} fill="paper" />
        <Ink d="M -100 -150 L -100 -176 L -20 -188" p={p} />
      </>
    );
  if (item.name === "emu")
    return (
      <>
        <Ink d="M -22 -92 L -24 -8 L -2 -8 M 24 -92 L 22 -8 L 44 -8" p={p} />
        <Ink d="M -82 -130 C -82 -192 40 -202 70 -166 C 82 -140 60 -95 0 -90 C -50 -88 -82 -95 -82 -130 Z" p={p} fill="paper" />
        <Ink d="M -82 -150 Q -112 -172 -102 -120 M -70 -120 Q -96 -122 -90 -96" p={p} />
        <Ink d="M 50 -180 C 62 -240 58 -270 62 -312 L 88 -312 C 84 -270 92 -232 76 -166" p={p} fill="paper" />
        <Ink d="M 58 -314 C 56 -340 100 -342 106 -320 L 138 -318 L 106 -306 C 98 -298 66 -298 58 -314" p={p} fill="paper" />
        <circle cx={86} cy={-324} r={4.5} fill={INK} opacity={p} />
      </>
    );
  if (item.name === "gun")
    return (
      <>
        <Ink d="M -12 -96 L -48 0 M 8 -98 L 34 0 M -4 -96 L -4 0" p={p} />
        <Ink d="M -70 -100 L 110 -122 L 112 -106 L -66 -84 Z" p={p} fill="paper" />
        <Ink d="M -10 -112 a 34 34 0 1 1 0.1 0" p={p} fill="paper" />
        <Ink d="M 110 -122 L 150 -126" p={p} />
      </>
    );
  const lines = wrapLines(text, 16);
  const width = Math.max(...lines.map((line) => line.length), 6) * 22 + 60;
  const height = lines.length * 40 + 40;
  return (
    <>
      <Ink d={`M ${-width / 2} ${-height / 2} h ${width} v ${height} h ${-width} Z`} p={p} fill="paper" />
      <Ink d={`M ${-width / 2 + 10} ${-height / 2 + 10} h ${width - 20} v ${height - 20} h ${-(width - 20)} Z`} p={p} width={2.5} />
      <Scribble lines={lines} x={0} y={-height / 2 + 52} size={36} p={p} family={theme.fonts.title} weight={700} />
    </>
  );
};

const WALL: Partial<Record<ThingItem["name"], number>> = { window: 560, picture: 620, chart: 560, calendar: 600, sign: 560 };

const Thing = ({ item, p }: { item: ThingItem; p: number }) => {
  const lift = item.y ?? WALL[item.name] ?? 0;
  return (
    <g transform={`translate(${stageX(item.x)} ${GROUND - lift}) scale(${(item.scale ?? 1) * (item.flip ? -1 : 1)} ${item.scale ?? 1})`}>
      <ThingArt item={item} p={p} />
    </g>
  );
};

const Bubble = ({ item, anchor, p }: { item: SayItem; anchor: PersonItem; p: number }) => {
  const lines = wrapLines(item.text, 14);
  const width = Math.max(...lines.map((line) => line.length)) * 21 + 64;
  const height = lines.length * 42 + 36;
  const personX = stageX(anchor.x);
  const centerX = Math.min(WIDTH - MARGIN - width / 2, Math.max(MARGIN + width / 2, personX + (item.dx ?? 0)));
  const bottom = GROUND - HEAD_TOP - 50 - (item.lift ?? 0);
  const left = centerX - width / 2;
  const top = bottom - height;
  const tailX = Math.min(left + width - 36, Math.max(left + 36, personX));
  return (
    <g>
      <Ink d={`M ${left + 26} ${top} h ${width - 52} q 26 0 26 26 v ${height - 52} q 0 26 -26 26 h ${-(width - 52)} q -26 0 -26 -26 v ${-(height - 52)} q 0 -26 26 -26 Z`} p={p} fill="paper" />
      <line x1={tailX - 16} x2={tailX + 16} y1={bottom} y2={bottom} stroke={PAPER} strokeWidth={STROKE + 3} opacity={p} />
      <Ink d={`M ${tailX - 16} ${bottom} L ${personX} ${bottom + 46} L ${tailX + 16} ${bottom}`} p={p} />
      <Scribble lines={lines} x={centerX} y={top + 44} size={36} p={p} />
    </g>
  );
};

const speckles = Array.from({ length: 170 }, (_, index) => {
  const a = Math.sin(index * 12.9898) * 43758.5453;
  const b = Math.sin(index * 78.233) * 12543.1234;
  const c = Math.sin(index * 39.425) * 9871.321;
  const frac = (value: number) => value - Math.floor(value);
  const below = index % 3 !== 0;
  return {
    x: frac(a) * WIDTH,
    y: below ? GROUND + 24 + frac(b) * (HEIGHT - GROUND - 40) : 200 + frac(b) * (GROUND - 240),
    length: 4 + frac(c) * 12,
    angle: frac(a + b) * 180,
    opacity: below ? 0.35 : 0.14,
  };
});

const Paper = () => (
  <g>
    {speckles.map((s, index) => (
      <line
        key={index}
        x1={s.x}
        y1={s.y}
        x2={s.x + Math.cos((s.angle * Math.PI) / 180) * s.length}
        y2={s.y + Math.sin((s.angle * Math.PI) / 180) * s.length}
        stroke={INK}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={s.opacity}
      />
    ))}
  </g>
);

const titleSize = (title: string): number => (title.length <= 16 ? 104 : title.length <= 26 ? 92 : 80);

const Title = ({ text }: { text: string }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const size = titleSize(text);
  const lines = wrapLines(maskProfanity(text), Math.floor(880 / (size * 0.62)));
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 200, opacity: enter, transform: `translateY(${(1 - enter) * -24}px)` }}>
      {lines.map((line) => (
        <div key={line} style={{ fontFamily: theme.fonts.title, fontWeight: 700, fontSize: size, lineHeight: 1.12, color: INK, textAlign: "center", letterSpacing: 1 }}>
          {line}
        </div>
      ))}
    </AbsoluteFill>
  );
};

const draw = (item: DoodleItem, frame: number, people: PersonItem[]): ReactNode => {
  const seconds = frame / FPS;
  if (!isVisible({ seconds, at: item.at, until: item.until })) return null;
  const p = drawProgress({ frame, at: item.at });
  if (item.kind === "person") return <Person key={`person-${item.id}`} item={item} p={p} />;
  if (item.kind === "thing") return <Thing key={`thing-${item.at}-${item.name}-${item.x}`} item={item} p={p} />;
  const anchor = people.find((person) => person.id === item.who);
  return anchor ? <Bubble key={`say-${item.at}-${item.who}`} item={item} anchor={anchor} p={p} /> : null;
};

export const Doodle = ({ scene, context }: DoodleProps) => {
  const frame = useCurrentFrame();
  const people = scene.items.filter((item): item is PersonItem => item.kind === "person");
  const ground = drawProgress({ frame, at: 0 });
  return (
    <Frame context={context}>
      <Title text={scene.title} />
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <g filter={PENCIL}>
          <Paper />
          <Ink d={`M 0 ${GROUND} H ${WIDTH}`} p={ground} width={3.5} />
          {scene.items.map((item) => draw(item, frame, people))}
        </g>
      </svg>
    </Frame>
  );
};
