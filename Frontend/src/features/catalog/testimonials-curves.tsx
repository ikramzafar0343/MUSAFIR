"use client";

import { useCallback, useRef } from "react";

import {
  SCROLL_CURVE_REST_BEND,
  useScrollVelocityBend,
} from "@/features/catalog/use-scroll-velocity-bend";

const VIEW_W = 100;
const VIEW_H = 40;
/** Side height in viewBox — sits near the section/FAQ join. */
const REST_SIDE = 14;
/** Visible resting scoop into the FAQ — never flat. */
const TESTIMONIALS_REST = Math.max(SCROLL_CURVE_REST_BEND, 0.52);

function bottomPath(bend: number): string {
  const amp = bend * 24;
  const side = REST_SIDE;
  const cy = Math.min(VIEW_H - 1, side + amp);
  return `M0,0 L${VIEW_W},0 L${VIEW_W},${side} Q${VIEW_W / 2},${cy} 0,${side} Z`;
}

/**
 * Velocity-driven cream bottom curve for testimonials → FAQ.
 */
export function TestimonialsCurves() {
  const pathRef = useRef<SVGPathElement>(null);

  const onBend = useCallback((bend: number) => {
    const local =
      TESTIMONIALS_REST + (bend - SCROLL_CURVE_REST_BEND) * 1.1;
    pathRef.current?.setAttribute(
      "d",
      bottomPath(Math.max(TESTIMONIALS_REST * 0.9, local)),
    );
  }, []);

  const rootRef = useScrollVelocityBend({
    sectionSelector: ".home-testimonials",
    onBend,
  });

  return (
    <div ref={rootRef} className="home-testimonials-curves" aria-hidden="true">
      <svg
        className="home-testimonials-scroll-curve"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        focusable="false"
      >
        <path
          ref={pathRef}
          className="home-testimonials-scroll-curve-fill"
          d={bottomPath(TESTIMONIALS_REST)}
        />
      </svg>
    </div>
  );
}
