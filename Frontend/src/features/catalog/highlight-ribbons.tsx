/**
 * Full-bleed lime sash — fills the SVG edge to edge.
 */
const RIBBON_BAND =
  "M-80,145 C280,80 520,250 760,155 C1000,60 1200,245 1520,150 " +
  "L1520,310 C1200,405 1000,220 760,315 C520,410 280,240 -80,305 Z";

export function HighlightRibbons() {
  return (
    <div className="product-highlights-ribbons" aria-hidden="true">
      <svg
        className="product-highlights-ribbon"
        viewBox="0 0 1440 460"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path className="product-highlights-ribbon-band" d={RIBBON_BAND} />
      </svg>
    </div>
  );
}
