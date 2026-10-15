"use client";

import { useEffect } from "react";

import {
  gsap,
  isMobileViewport,
  prefersReducedMotion,
  registerGsapPlugins,
  ScrollTrigger,
} from "@/features/motion/motion-config";

/** M07 — stroke draw accents + differential parallax on decorative layers. */
export function useDrawAndParallax(rootSelector = ".home-flow") {
  useEffect(() => {
    registerGsapPlugins();
    const root = document.querySelector(rootSelector);
    if (!(root instanceof HTMLElement)) {
      return;
    }

    const reduced = prefersReducedMotion();
    const mobile = isMobileViewport();

    const ctx = gsap.context(() => {
      const paths = root.querySelectorAll<SVGPathElement>(".vd-draw-path");
      paths.forEach((path, index) => {
        const length = path.getTotalLength?.() ?? 240;
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
        if (reduced) {
          gsap.set(path, { strokeDashoffset: 0 });
          return;
        }
        ScrollTrigger.create({
          trigger: path.closest("svg") ?? path,
          start: "top 80%",
          once: true,
          onEnter: () => {
            gsap.to(path, {
              strokeDashoffset: 0,
              duration: paths.length > 1 ? 1 : 1.5,
              delay: paths.length > 1 ? index * 0.35 : 0,
              ease: "power2.out",
            });
          },
        });
      });

      if (reduced || mobile) {
        return;
      }

      const layers = [
        { sel: ".vd-parallax-a", y: "-15vh", x: "0", rotate: 0 },
        { sel: ".vd-parallax-b", y: "8vh", x: "3vw", rotate: 2 },
        { sel: ".vd-parallax-c", y: "-6vh", x: "-2vw", rotate: -1.5 },
      ];

      layers.forEach((layer) => {
        root.querySelectorAll(layer.sel).forEach((el) => {
          gsap.to(el, {
            y: layer.y,
            x: layer.x,
            rotate: layer.rotate,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.5,
            },
          });
        });
      });
    }, root);

    return () => ctx.revert();
  }, [rootSelector]);
}

/** Original leather/tack accent strokes for headings. */
export function TackAccent({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "vd-tack-accent"}
      viewBox="0 0 220 36"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="vd-draw-path"
        d="M8 22c36-14 72-18 108-8 28 8 52 12 84 4 12-3 22-8 32-12"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        className="vd-draw-path"
        d="M24 28c22-4 48-2 70 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
