import { useCurrentFrame } from "remotion";

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

export const Avatar = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round">
    <circle cx={32} cy={32} r={28} />
    <circle cx={23} cy={27} r={2.6} fill={INK} />
    <circle cx={41} cy={27} r={2.6} fill={INK} />
    <path d="M 21 40 Q 32 49 43 40" />
  </svg>
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
