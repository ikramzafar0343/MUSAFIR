import Image from "next/image";
import type { ReactNode } from "react";

import { Logo } from "@/components/ui/logo";
import { brandName } from "@/constants/brand";
import { resolvePublicAssetSrc } from "@/lib/public-assets";

export function AuthPageFrame({
  image,
  imageAlt,
  children,
}: {
  image: string;
  imageAlt: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="auth-page-logo">
        <Logo theme="light" size="auth" />
      </div>
      <div className="auth-layout">
        <aside className="auth-brand-panel" aria-label={`${brandName} brand`}>
          {image ? (
            <Image
              src={resolvePublicAssetSrc(image)}
              alt={imageAlt}
              fill
              className="auth-brand-image"
              sizes="50vw"
              priority
              unoptimized
            />
          ) : null}
          <div className="auth-brand-overlay" aria-hidden="true" />
        </aside>
        {children}
      </div>
    </div>
  );
}
