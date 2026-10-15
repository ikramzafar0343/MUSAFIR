type Tone = "white" | "cream";

/** dome: the lower colour arcs up in the middle. bowl: it dips down in the middle. */
type Shape = "dome" | "bowl";

const SHAPE_PATH: Record<Shape, string> = {
  dome: "M0,132 C300,46 520,8 720,8 C920,8 1140,46 1440,132 L1440,148 L0,148 Z",
  bowl: "M0,14 C300,100 520,140 720,140 C920,140 1140,100 1440,14 L1440,148 L0,148 Z",
};

type WaveDividerProps = {
  /** Colour of the area above the curve. */
  from: Tone;
  /** Colour of the area below the curve. */
  to: Tone;
  shape?: Shape;
};

export function WaveDivider({ from, to, shape = "dome" }: WaveDividerProps) {
  return (
    <div
      className={`wave-divider wave-divider--from-${from} wave-divider--to-${to} wave-divider--${shape}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1440 148" preserveAspectRatio="none" focusable="false">
        <path d={SHAPE_PATH[shape]} />
      </svg>
    </div>
  );
}
