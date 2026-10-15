import Image from "next/image";
import Link from "next/link";

import {
  brandHomeLabel,
  brandLogoMark,
  brandLogoMarkAlt,
  brandLogoMarkOnDark,
} from "@/constants/brand";
import { cn } from "@/lib/cn";

type HeaderBrandProps = {
  theme?: "dark" | "light";
};

export function HeaderBrand({ theme = "dark" }: HeaderBrandProps) {
  const src = theme === "light" ? brandLogoMarkOnDark : brandLogoMark;
  return (
    <Link href="/" className="brand-logo header-brand-link" aria-label={brandHomeLabel}>
      <span className={cn("header-brand-mark", theme === "light" && "is-light")}>
        <Image
          src={src}
          alt={brandLogoMarkAlt}
          width={220}
          height={38}
          className="brand-logo-mark-img"
          priority
          unoptimized
        />
      </span>
    </Link>
  );
}
