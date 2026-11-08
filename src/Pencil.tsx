import { Img, staticFile, useCurrentFrame } from "remotion";

export const INK = "#F1EEE6";
export const PENCIL = "url(#pencil)";
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const circlePath = (cx: number, cy: number, r: number): string =>
  `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;

export const PencilDefs = () => {
  const frame = useCurrentFrame();
  const seed = (Math.floor(frame / 3) % 5) + 1;
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <filter id="pencil" filterUnits="userSpaceOnUse" x={0} y={0} width={WIDTH} height={HEIGHT}>
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={2} seed={seed} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale={7} xChannelSelector="R" yChannelSelector="G" result="wobbly" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={7} result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.05" result="mask" />
          <feComposite in="wobbly" in2="mask" operator="in" />
        </filter>
      </defs>
    </svg>
  );
};

const LOGO_SCALE = 2.35;
const LOGO_RATIO = 1307 / 736;

export const Avatar = ({ size }: { size: number }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", position: "relative", border: `${Math.max(2, size / 28)}px solid ${INK}`, boxSizing: "border-box", background: "#FAF8F3" }}>
    <Img
      src={staticFile("logo.jpg")}
      style={{ position: "absolute", width: size * LOGO_SCALE, height: size * LOGO_SCALE * LOGO_RATIO, left: -0.62 * size, top: -0.155 * size * 1.0 }}
    />
  </div>
);

export const WavyLine = ({ width, progress }: { width: number; progress: number }) => (
  <svg width={width} height={28} viewBox={`0 0 ${width} 28`} fill="none">
    <path
      d={`M 4 14 Q ${width * 0.12} 2 ${width * 0.25} 14 T ${width * 0.5} 14 T ${width * 0.75} 14 T ${width - 4} 12`}
      stroke={INK}
      strokeWidth={5}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - progress}
    />
  </svg>
);
