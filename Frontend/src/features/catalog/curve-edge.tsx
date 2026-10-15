type CurveEdgeProps = {
  /** Which edge of the cream band the white ellipse sits on. */
  edge: "top" | "bottom";
  className?: string;
};

/**
 * Wide shallow white ellipse used as a section transition.
 * Geometry is driven by --curve-width / --curve-depth on the parent.
 */
export function CurveEdge({ edge, className = "" }: CurveEdgeProps) {
  return (
    <div
      className={`curve-edge curve-edge--${edge} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
