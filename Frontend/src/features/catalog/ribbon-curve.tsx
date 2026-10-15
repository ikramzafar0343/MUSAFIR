/**
 * Lime ribbon behind the Why feature cards — visible on every viewport.
 */
const RIBBON_GUIDE = "M-40,150 C220,70 420,230 720,150 C1020,70 1220,230 1480,150";

export function RibbonCurve({ className = "" }: { className?: string }) {
  return (
    <div className={`ribbon-curve ${className}`.trim()} aria-hidden="true">
      <svg
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="ribbon-curve-band"
          d={RIBBON_GUIDE}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
