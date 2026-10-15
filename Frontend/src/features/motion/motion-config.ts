import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** VOLDOG-derived curves mapped to MUSAFIR motion tokens. */
export const MOTION = {
  sweep: "cubic-bezier(0.785, 0.135, 0.15, 0.86)",
  out: "cubic-bezier(0.19, 1, 0.22, 1)",
  panel: "cubic-bezier(0.2, 1, 0.3, 1)",
  menuIn: "cubic-bezier(0.45, 0.05, 0, 1)",
  menuOut: "cubic-bezier(0.25, 0.25, 0, 1)",
  switch: "cubic-bezier(0.77, 0, 0.175, 1)",
  reveal: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  cardHover: "cubic-bezier(0.2, 0.75, 0.5, 1)",
  sweepMs: 650,
  revealMs: 800,
  menuInMs: 600,
  menuOutMs: 400,
  disclosureMs: 300,
  snapMs: 400,
} as const;

/** Motion for React four-number easing arrays. */
export const EASE = {
  sweep: [0.785, 0.135, 0.15, 0.86] as const,
  out: [0.19, 1, 0.22, 1] as const,
  panel: [0.2, 1, 0.3, 1] as const,
  menuIn: [0.45, 0.05, 0, 1] as const,
  menuOut: [0.25, 0.25, 0, 1] as const,
  switch: [0.77, 0, 0.175, 1] as const,
  reveal: [0.25, 0.1, 0.25, 1] as const,
  cardHover: [0.2, 0.75, 0.5, 1] as const,
};

export function registerGsapPlugins(): void {
  if (registered || typeof window === "undefined") {
    return;
  }
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  // Mobile URL-bar show/hide fires resize constantly; refreshing on it stalls scroll.
  ScrollTrigger.config({
    ignoreMobileResize: true,
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
  });
  CustomEase.create("brandSweep", "0.785,0.135,0.15,0.86");
  CustomEase.create("expressiveOut", "0.19,1,0.22,1");
  CustomEase.create("panelOut", "0.2,1,0.3,1");
  CustomEase.create("menuEnter", "0.45,0.05,0,1");
  CustomEase.create("menuExit", "0.25,0.25,0,1");
  CustomEase.create("stateSwitch", "0.77,0,0.175,1");
  CustomEase.create("revealEase", "0.25,0.1,0.25,1");
  registered = true;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isDesktopFinePointer(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(min-width: 768px) and (pointer: fine)").matches;
}

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return window.matchMedia("(max-width: 767px)").matches;
}

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Refresh ScrollTrigger after fonts + window load settle layout,
 * and optionally when `.home-flow` resizes.
 */
export function armScrollTriggerLayoutRefresh(rootSelector = ".home-flow"): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  registerGsapPlugins();

  let cleaned = false;
  let resizeObserver: ResizeObserver | null = null;
  const refresh = () => {
    if (!cleaned) {
      ScrollTrigger.refresh();
    }
  };

  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  const loadReady =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          window.addEventListener("load", () => resolve(), { once: true });
        });

  void Promise.all([fontsReady, loadReady]).then(refresh);

  const root = document.querySelector(rootSelector);
  if (root instanceof HTMLElement && typeof ResizeObserver !== "undefined") {
    let timer = 0;
    resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(refresh, 160);
    });
    resizeObserver.observe(root);
  }

  return () => {
    cleaned = true;
    resizeObserver?.disconnect();
  };
}

export { gsap, ScrollTrigger };
