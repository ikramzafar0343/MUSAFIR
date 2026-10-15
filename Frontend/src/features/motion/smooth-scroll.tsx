"use client";

import "lenis/dist/lenis.css";

import { useEffect } from "react";

import { gsap, isDesktopFinePointer, prefersReducedMotion, registerGsapPlugins, ScrollTrigger } from "@/features/motion/motion-config";
import { isScrollLocked, onScrollLockChange } from "@/lib/scroll-lock";

const DESKTOP_MQ = "(min-width: 768px) and (pointer: fine)";
const REDUCED_MQ = "(prefers-reduced-motion: reduce)";

type LenisInstance = {
  on: (event: "scroll", cb: () => void) => void;
  raf: (time: number) => void;
  destroy: () => void;
  stop: () => void;
  start: () => void;
  scrollTo: (
    target: HTMLElement,
    opts: { offset: number; duration: number; easing: (value: number) => number },
  ) => void;
};

/**
 * Desktop Lenis smooth scroll driven by the GSAP ticker (single RAF owner).
 * Lenis is dynamically imported so phones never parse the smooth-scroll bundle.
 */
export function SmoothScroll() {
  useEffect(() => {
    registerGsapPlugins();

    const desktop = window.matchMedia(DESKTOP_MQ);
    const reduced = window.matchMedia(REDUCED_MQ);

    let lenis: LenisInstance | null = null;
    let tickerFn: ((time: number) => void) | null = null;
    let unbindAnchors: (() => void) | undefined;
    let startGeneration = 0;

    const stop = () => {
      unbindAnchors?.();
      unbindAnchors = undefined;
      if (tickerFn) {
        gsap.ticker.remove(tickerFn);
        tickerFn = null;
      }
      if (lenis) {
        lenis.destroy();
        lenis = null;
      }
      document.documentElement.classList.remove("has-smooth-scroll");
      ScrollTrigger.refresh();
    };

    const bindAnchors = (instance: LenisInstance) => {
      const onAnchorClick = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        const link = (event.target as Element | null)?.closest?.("a[href]");
        if (!link || link.hasAttribute("data-no-smooth")) {
          return;
        }

        const href = link.getAttribute("href");
        if (!href || href === "#") {
          return;
        }

        let targetId: string | null = null;
        try {
          if (href.startsWith("#")) {
            targetId = href.slice(1);
          } else {
            const url = new URL(href, window.location.href);
            const current = window.location.pathname.replace(/\/+$/, "");
            const next = url.pathname.replace(/\/+$/, "");
            if (current !== next) {
              return;
            }
            targetId = url.hash ? url.hash.slice(1) : null;
          }
        } catch {
          return;
        }

        if (!targetId) {
          return;
        }
        const target = document.getElementById(targetId);
        if (!target) {
          return;
        }

        event.preventDefault();
        instance.scrollTo(target, {
          offset: -88,
          duration: 0.85,
          easing: (value) => 1 - Math.pow(1 - value, 3),
        });
      };

      document.addEventListener("click", onAnchorClick);
      return () => document.removeEventListener("click", onAnchorClick);
    };

    const start = async () => {
      const generation = ++startGeneration;
      stop();
      if (!desktop.matches || reduced.matches || !isDesktopFinePointer() || prefersReducedMotion()) {
        return;
      }

      const { default: Lenis } = await import("lenis");
      if (generation !== startGeneration) {
        return;
      }

      lenis = new Lenis({
        lerp: 0.14,
        wheelMultiplier: 1,
        touchMultiplier: 1,
        smoothWheel: true,
        autoRaf: false,
        syncTouch: false,
      }) as LenisInstance;

      lenis.on("scroll", ScrollTrigger.update);

      tickerFn = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickerFn);
      // Let scroll catch up after frame spikes (default lagSmoothing felt sticky with Lenis).
      gsap.ticker.lagSmoothing(0);

      document.documentElement.classList.add("has-smooth-scroll");
      unbindAnchors = bindAnchors(lenis);
      if (isScrollLocked()) {
        lenis.stop();
      }
      ScrollTrigger.refresh();
    };

    const sync = () => {
      void start();
    };

    // Let the hero decode / first paint win the first frames on cold loads.
    const startTimer = window.setTimeout(sync, 120);
    desktop.addEventListener("change", sync);
    reduced.addEventListener("change", sync);

    const unsubscribeLock = onScrollLockChange((locked) => {
      if (!lenis) {
        return;
      }
      if (locked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    return () => {
      startGeneration += 1;
      window.clearTimeout(startTimer);
      desktop.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
      unsubscribeLock();
      stop();
    };
  }, []);

  return null;
}
