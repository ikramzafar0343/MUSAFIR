"use client";

import { useCallback, useRef } from "react";

import {
  SCROLL_CURVE_REST_BEND,
  useScrollVelocityBend,
} from "@/features/catalog/use-scroll-velocity-bend";

const VIEW_W = 100;
const VIEW_H = 40;
const REST_MID = 14;
/** Stronger resting bowl so the lifestyle band matches the deep white scoop. */
const GLOW_REST = Math.max(SCROLL_CURVE_REST_BEND, 0.55);

function topPath(bend: number): string {
  const amp = bend * 22;
  const mid = REST_MID;
  const cy = mid + amp;
  return `M0,0 L${VIEW_W},0 L${VIEW_W},${mid} Q${VIEW_W / 2},${cy} 0,${mid} Z`;
}

/**
 * Velocity-driven white top curve for glow-stats (same feel as highlights).
 */
export function GlowStatsCurves() {
  const pathRef = useRef<SVGPathElement>(null);

  const onBend = useCallback((bend: number) => {
    /* Map shared bend onto a deeper glow-specific range. */
    const glowBend = GLOW_REST + (bend - SCROLL_CURVE_REST_BEND) * 1.15;
    pathRef.current?.setAttribute("d", topPath(Math.max(GLOW_REST * 0.9, glowBend)));
  }, []);

  const rootRef = useScrollVelocityBend({
    sectionSelector: ".glow-stats",
    onBend,
  });

  return (
    <div ref={rootRef} className="glow-stats-curves" aria-hidden="true">
      <svg
        className="glow-stats-scroll-curve"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        focusable="false"
      >
        <path
          ref={pathRef}
          className="glow-stats-scroll-curve-fill"
          d={topPath(GLOW_REST)}
        />
      </svg>
    </div>
  );
}
