import Image from "next/image";
import Link from "next/link";

import {
  brandHomeLabel,
  brandLogoMark,
  brandLogoMarkAlt,
  brandLogoMarkOnDark,
  brandName,
} from "@/constants/brand";
import { cn } from "@/lib/cn";

type LogoSize = "nav" | "watermark" | "inline" | "product" | "auth";

type LogoProps = {
  theme?: "dark" | "light";
  size?: LogoSize | undefined;
  className?: string | undefined;
  linked?: boolean | undefined;
  priority?: boolean | undefined;
};

const SIZE_CLASS: Record<LogoSize, string> = {
  nav: "brand-logo-mark--nav",
  watermark: "brand-logo-mark--watermark",
  inline: "brand-logo-mark--inline",
  product: "brand-logo-mark--product",
  auth: "brand-logo-mark--auth",
};

/** Intrinsic wordmark box (~5.9:1). Height drives layout; width follows. */
const SIZE_BOX: Record<LogoSize, { w: number; h: number }> = {
  nav: { w: 220, h: 38 },
  watermark: { w: 96, h: 17 },
  inline: { w: 120, h: 21 },
  product: { w: 110, h: 19 },
  auth: { w: 280, h: 48 },
};

export function Logo({
  theme = "dark",
  size = "nav",
  className,
  linked = true,
  priority = false,
}: LogoProps) {
  const box = SIZE_BOX[size];
  const src = theme === "light" ? brandLogoMarkOnDark : brandLogoMark;
  const mark = (
    <span
      className={cn(
        "brand-logo-mark",
        SIZE_CLASS[size],
        theme === "light" && "is-light",
        className,
      )}
    >
      <Image
        src={src}
        alt={brandLogoMarkAlt}
        width={box.w}
        height={box.h}
        className="brand-logo-mark-img"
        priority={priority || size === "nav" || size === "auth"}
        unoptimized
      />
      <span className="sr-only">{brandName}</span>
    </span>
  );

  if (!linked) {
    return mark;
  }

  return (
    <Link href="/" className="brand-logo inline-flex max-w-full items-center" aria-label={brandHomeLabel}>
      {mark}
    </Link>
  );
}
