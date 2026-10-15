"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  SCROLL_CURVE_REST_BEND,
  useScrollVelocityBend,
} from "@/features/catalog/use-scroll-velocity-bend";

/** Build a pixel-space clip path for the cream wash. */
function clipPathD(bend: number, w: number, h: number): string {
  const insetY = h * 0.14;
  const top = insetY - bend * h * 0.12;
  const bot = h - insetY + bend * h * 0.12;
  const tc = top + bend * h * 0.22;
  const bc = bot - bend * h * 0.22;
  return `M0,${top.toFixed(2)} Q${(w / 2).toFixed(2)},${tc.toFixed(2)} ${w.toFixed(2)},${top.toFixed(2)} L${w.toFixed(2)},${bot.toFixed(2)} Q${(w / 2).toFixed(2)},${bc.toFixed(2)} 0,${bot.toFixed(2)} Z`;
}

/**
 * Scroll-velocity cream wash curves for product-highlights.
 * Bend follows scroll speed/direction with spring settle — not raw scrollY.
 */
export function HighlightCurves() {
  const washRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  const applyBend = useCallback((bend: number) => {
    const wash = washRef.current;
    if (!wash) {
      return;
    }
    let { w, h } = sizeRef.current;
    if (!w || !h) {
      w = wash.offsetWidth || window.innerWidth;
      h = wash.offsetHeight || 1;
      sizeRef.current = { w, h };
    }
    const d = clipPathD(bend, w, h);
    const path = `path('${d}')`;
    wash.style.clipPath = path;
    (wash.style as CSSStyleDeclaration & { webkitClipPath: string }).webkitClipPath = path;
  }, []);

  const rootRef = useScrollVelocityBend({
    sectionSelector: ".product-highlights",
    onBend: applyBend,
  });

  useEffect(() => {
    const wash = washRef.current;
    if (!wash) {
      return;
    }
    const measure = () => {
      sizeRef.current = {
        w: wash.offsetWidth || window.innerWidth,
        h: wash.offsetHeight || 1,
      };
      applyBend(SCROLL_CURVE_REST_BEND);
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      wash.style.clipPath = "";
      (wash.style as CSSStyleDeclaration & { webkitClipPath: string }).webkitClipPath = "";
    };
  }, [applyBend]);

  return (
    <div ref={rootRef} className="highlight-curves" aria-hidden="true">
      <div ref={washRef} className="highlight-curve-wash" />
    </div>
  );
}
