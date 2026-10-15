"use client";

import { useEffect } from "react";

import {
  gsap,
  isCoarsePointer,
  isMobileViewport,
  prefersReducedMotion,
  registerGsapPlugins,
  ScrollTrigger,
} from "@/features/motion/motion-config";

/** M08 — GSAP entrance on card wrappers only (CSS owns hover). Desktop fine-pointer only. */
export function useCardEntrances(rootSelector = ".home-flow") {
  useEffect(() => {
    registerGsapPlugins();
    const root = document.querySelector(rootSelector);
    // Never leave cards at opacity 0 on mobile/touch — skip the scene entirely.
    if (!(root instanceof HTMLElement) || prefersReducedMotion() || isMobileViewport() || isCoarsePointer()) {
      return;
    }

    const ctx = gsap.context(() => {
      const groups = [
        ".shop-range-track > .vd-card-entrance",
        ".best-sellers-rail-track > .vd-card-entrance",
      ];

      groups.forEach((sel) => {
        const cards = root.querySelectorAll(sel);
        if (!cards.length) {
          return;
        }
        gsap.set(cards, { y: 28, opacity: 0 });
        ScrollTrigger.batch(cards, {
          start: "top 88%",
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, {
              y: 0,
              opacity: 1,
              duration: 0.55,
              stagger: { each: 0.08, from: "start" },
              ease: "power2.out",
              overwrite: true,
            });
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, [rootSelector]);
}
