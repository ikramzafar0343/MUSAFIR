import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

function CtaArrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type PillCtaProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

/** Pill CTA with expanding accent fill + exchanging arrows (M04). */
export function PillCta({ href, children, className }: PillCtaProps) {
  return (
    <Link href={href} className={cn("vd-pill-cta", className)}>
      <span className="vd-pill-cta-label">{children}</span>
      <span className="vd-pill-cta-arrow" aria-hidden="true">
        <span className="vd-pill-cta-arrow-track">
          <span className="vd-pill-cta-arrow-item vd-pill-cta-arrow-item--a">
            <CtaArrow />
          </span>
          <span className="vd-pill-cta-arrow-item vd-pill-cta-arrow-item--b">
            <CtaArrow />
          </span>
        </span>
      </span>
    </Link>
  );
}
