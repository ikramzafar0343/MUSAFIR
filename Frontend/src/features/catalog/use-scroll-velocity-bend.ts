"use client";

import { useEffect, useRef } from "react";

/** Idle resting bend — always a visible bowl, never flat. */
export const SCROLL_CURVE_REST_BEND = 0.32;

type BendOptions = {
  /** CSS selector for the section root (e.g. ".glow-stats"). */
  sectionSelector: string;
  onBend: (bend: number) => void;
};

/**
 * Shared scroll-velocity bend. Returns a ref to attach on the section (or a child).
 * Callers render geometry from `onBend`; no React state on the hot path.
 */
export function useScrollVelocityBend({ sectionSelector, onBend }: BendOptions) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onBendRef = useRef(onBend);

  useEffect(() => {
    onBendRef.current = onBend;
  }, [onBend]);

  useEffect(() => {
    const root = rootRef.current;
    const section = root?.closest<HTMLElement>(sectionSelector) ?? null;
    if (!root || !section) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 768px)").matches;
    if (reduced || coarse || narrow) {
      onBendRef.current(SCROLL_CURVE_REST_BEND);
      return;
    }

    let raf = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let velocity = 0;
    let bend = SCROLL_CURVE_REST_BEND;
    let target = SCROLL_CURVE_REST_BEND;
    let idleMs = 0;
    let active = false;
    let emitted = bend;

    const sectionNear = () => {
      const rect = section.getBoundingClientRect();
      const pad = window.innerHeight * 0.4;
      return rect.bottom > -pad && rect.top < window.innerHeight + pad;
    };

    const settled = () =>
      Math.abs(velocity) < 0.08 &&
      Math.abs(bend - SCROLL_CURVE_REST_BEND) < 0.0012 &&
      Math.abs(target - SCROLL_CURVE_REST_BEND) < 0.0012;

    const tick = (now: number) => {
      const dt = Math.min(40, Math.max(6, now - lastT));
      lastT = now;

      const y = window.scrollY;
      const rawV = ((y - lastY) / dt) * 16.67;
      lastY = y;

      velocity += (rawV - velocity) * 0.12;

      const maxDelta = 0.7;
      const gain = 0.07;
      const fromVelocity = Math.max(
        SCROLL_CURVE_REST_BEND * 0.9,
        Math.min(SCROLL_CURVE_REST_BEND + maxDelta, SCROLL_CURVE_REST_BEND + velocity * gain),
      );

      if (Math.abs(velocity) < 0.35) {
        idleMs += dt;
      } else {
        idleMs = 0;
        target += (fromVelocity - target) * 0.12;
      }

      if (idleMs > 120) {
        target += (SCROLL_CURVE_REST_BEND - target) * 0.045;
      }

      bend += (target - bend) * (idleMs > 120 ? 0.055 : 0.09);
      bend = Math.max(bend, SCROLL_CURVE_REST_BEND * 0.85);

      if (idleMs > 120) {
        velocity *= 0.94;
      }

      // Rebuilding the path costs an SVG reparse; skip sub-visual deltas.
      if (Math.abs(bend - emitted) > 0.0006) {
        emitted = bend;
        onBendRef.current(bend);
      }

      // Park the loop once motion dies down; `kick` restarts it on next scroll.
      if (settled()) {
        active = false;
        raf = 0;
        bend = SCROLL_CURVE_REST_BEND;
        target = SCROLL_CURVE_REST_BEND;
        velocity = 0;
        emitted = bend;
        onBendRef.current(bend);
        return;
      }

      raf = window.requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!active && sectionNear()) {
        active = true;
        lastY = window.scrollY;
        lastT = performance.now();
        raf = window.requestAnimationFrame(tick);
      }
    };

    onBendRef.current(bend);
    if (sectionNear()) {
      kick();
    }

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick, { passive: true });

    return () => {
      active = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, [sectionSelector]);

  return rootRef;
}
