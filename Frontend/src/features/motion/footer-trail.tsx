"use client";

import { useEffect, useRef } from "react";

/** Matches `.cursor-dot` base diameter (globals.css). */
const CURSOR_SIZE = 15;
const INTERACTIVE = "a, button, select, summary, label, [role='button'], input, textarea";
const DRAG = "[data-cursor-drag], .best-sellers-rail-viewport.is-dragging";

/** Lightweight SVG accent trail — stroke width tracks the cursor dot (incl. CTA / header hover scale). */
export function FooterTrail({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const path = svg.querySelector("path");
    if (!path) {
      return;
    }

    const SEGMENTS = 12;
    pointsRef.current = Array.from({ length: SEGMENTS }, () => ({ x: 0, y: 0 }));
    let frame = 0;
    let active = false;
    let mx = 0;
    let my = 0;
    let strokeScale = 1;
    let sectionW = 0;
    let sectionH = 0;

    const section = svg.closest(".glow-stats, .site-footer, .vd-footer-trail-host");

    const syncStroke = (scale: number) => {
      strokeScale = scale;
      path.setAttribute("stroke-width", String(CURSOR_SIZE * scale));
    };

    const sizeSvg = () => {
      if (!section) {
        return;
      }
      const rect = section.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      if (w === sectionW && h === sectionH) {
        return;
      }
      sectionW = w;
      sectionH = h;
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.style.width = `${w}px`;
      svg.style.height = `${h}px`;
    };

    syncStroke(1);
    sizeSvg();

    const resizeObserver =
      section && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            sizeSvg();
          })
        : null;
    if (section && resizeObserver) {
      resizeObserver.observe(section);
    }

    const tick = () => {
      if (active) {
        const pts = pointsRef.current;
        const head = pts[0];
        if (!head) {
          frame = window.requestAnimationFrame(tick);
          return;
        }
        head.x += (mx - head.x) / 4;
        head.y += (my - head.y) / 4;
        for (let i = 1; i < pts.length; i++) {
          const curr = pts[i];
          const prev = pts[i - 1];
          if (!curr || !prev) {
            continue;
          }
          curr.x += (prev.x - curr.x) / 5;
          curr.y += (prev.y - curr.y) / 5;
        }
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
        path.setAttribute("d", d);
        if (strokeScale !== 1) {
          path.setAttribute("stroke-width", String(CURSOR_SIZE * strokeScale));
        }
        frame = window.requestAnimationFrame(tick);
        return;
      }
      frame = 0;
    };

    const onMove = (event: PointerEvent) => {
      if (!section) {
        return;
      }
      const rect = section.getBoundingClientRect();
      if (event.clientY < rect.top - 40 || event.clientY > rect.bottom + 40) {
        active = false;
        path.setAttribute("d", "");
        return;
      }

      const el = event.target;
      if (el instanceof Element) {
        if (el.closest(DRAG)) {
          syncStroke(4);
        } else if (
          el.closest(INTERACTIVE) ||
          el.closest("[data-musafir-header], .vd-pill-cta, .site-header")
        ) {
          syncStroke(2);
        } else {
          syncStroke(1);
        }
      }

      active = true;
      mx = event.clientX - rect.left;
      my = event.clientY - rect.top;
      if (!frame) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <svg ref={svgRef} className={className ?? "vd-footer-trail"} aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={CURSOR_SIZE}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
