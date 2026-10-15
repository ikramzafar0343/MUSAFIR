"use client";

import { useEffect, useRef } from "react";

/**
 * M11 — accent pointer follower.
 * Reference follow: (target−current)/6 with time-aware alpha.
 * 15px base; 2× / 4× on interactive / drag targets.
 */
export function CursorDot() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) {
      return;
    }
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let targetScale = 1;
    let currentScale = 1;
    let started = false;
    let frame = 0;
    let lastT = performance.now();
    let paused = false;

    const INTERACTIVE = "a, button, select, summary, label, [role='button'], input, textarea";
    const DRAG = "[data-cursor-drag], .best-sellers-rail-viewport.is-dragging";

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!started) {
        started = true;
        currentX = targetX;
        currentY = targetY;
        wrap.classList.add("is-active");
      }
      const el = event.target;
      if (el instanceof Element) {
        if (el.closest(DRAG)) {
          targetScale = 4;
          wrap.classList.add("is-drag");
          wrap.classList.remove("is-hover");
        } else if (el.closest(INTERACTIVE)) {
          targetScale = 2;
          wrap.classList.add("is-hover");
          wrap.classList.remove("is-drag");
        } else {
          targetScale = 1;
          wrap.classList.remove("is-hover", "is-drag");
        }
      }
      paused = false;
      ensureFrame();
    };

    const onLeave = () => {
      started = false;
      wrap.classList.remove("is-active", "is-hover", "is-drag");
      paused = true;
    };

    const tick = (now: number) => {
      const deltaMs = Math.min(64, now - lastT);
      lastT = now;
      if (paused || !started) {
        frame = 0;
        return;
      }
      const alpha = 1 - Math.pow(5 / 6, deltaMs / (1000 / 60));
      currentX += (targetX - currentX) * alpha;
      currentY += (targetY - currentY) * alpha;
      currentScale += (targetScale - currentScale) * alpha;
      wrap.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      inner.style.transform = `scale(${currentScale})`;
      const settled =
        Math.abs(targetX - currentX) < 0.05 &&
        Math.abs(targetY - currentY) < 0.05 &&
        Math.abs(targetScale - currentScale) < 0.002;
      if (settled) {
        frame = 0;
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    /** Idle pointer must not hold an open animation frame loop. */
    function ensureFrame() {
      if (frame) return;
      lastT = performance.now();
      frame = window.requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className="cursor-dot" aria-hidden="true">
      <div ref={innerRef} className="cursor-dot-inner" />
      <span className="cursor-dot-label">Drag</span>
    </div>
  );
}
