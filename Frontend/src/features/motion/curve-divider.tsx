"use client";

import { useEffect, useId, useRef } from "react";

import {
  gsap,
  isMobileViewport,
  prefersReducedMotion,
  registerGsapPlugins,
  ScrollTrigger,
} from "@/features/motion/motion-config";

type CurveDividerProps = {
  /** Fill matching the section below the curve. */
  fill: string;
  className?: string;
  inverse?: boolean;
};

function buildPath(w: number, h: number, p: number, c: number, inverse: boolean): string {
  const edgeY = p * h;
  const controlY = (1 - p) * h * c;
  if (inverse) {
    return `M0,0 L${w},0 L${w},${h} C${w * 0.75},${h - controlY} ${w * 0.25},${h - controlY} 0,${h - edgeY} Z`;
  }
  return `M0,${edgeY} C${w * 0.25},${controlY} ${w * 0.75},${controlY} ${w},${edgeY} L${w},0 L0,0 Z`;
}

/** M06 — scroll-progress curved section boundary. */
export function CurveDivider({ fill, className, inverse = false }: CurveDividerProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    registerGsapPlugins();
    const path = pathRef.current;
    const wrap = wrapRef.current;
    if (!path || !wrap) {
      return;
    }

    const reduced = prefersReducedMotion();
    const mobile = isMobileViewport();
    const curvature = 0.7;
    let param = reduced || mobile ? 0.25 : 0;
    let target = param;

    const w = 1440;
    const h = mobile ? 72 : 160;

    const paint = () => {
      path.setAttribute("d", buildPath(w, h, param, curvature, inverse));
    };
    paint();

    if (reduced || mobile) {
      return;
    }

    const ctx = gsap.context(() => {
      const proxy = { p: 0 };
      ScrollTrigger.create({
        trigger: wrap,
        start: "-10% 100%",
        end: "-30% 0%",
        scrub: false,
        onUpdate: (self) => {
          target = self.progress * 0.7;
          gsap.to(proxy, {
            p: target,
            duration: 0.3,
            ease: "power2.out",
            overwrite: true,
            onUpdate: () => {
              param = proxy.p;
              paint();
            },
          });
        },
      });
    }, wrap);

    return () => ctx.revert();
  }, [inverse]);

  return (
    <div ref={wrapRef} className={`vd-curve-divider ${className ?? ""}`} aria-hidden="true">
      <svg
        className="vd-curve-divider-svg"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
      >
        <path ref={pathRef} id={`vd-curve-${uid}`} fill={fill} />
      </svg>
    </div>
  );
}
