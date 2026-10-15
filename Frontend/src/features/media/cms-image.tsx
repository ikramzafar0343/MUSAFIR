import Image, { type ImageProps } from "next/image";

import { resolvePublicAssetSrc } from "@/lib/public-assets";

/** Hosts Next is already allowed to optimize via next.config remotePatterns. */
const OPTIMIZABLE_REMOTE_HOSTS = new Set([
  "res.cloudinary.com",
  "musafir.com",
  "www.musafir.com",
  "localhost",
  "127.0.0.1",
]);

function pathOnly(src: string): string {
  try {
    if (/^https?:\/\//i.test(src)) {
      return new URL(src).pathname;
    }
  } catch {
    /* fall through */
  }
  return src.split(/[?#]/)[0] ?? src;
}

/** Rewrite CMS `/uploads/<file>` → `/media/<file>` so `/_next/image` can fetch via route handler. */
function rewriteUploadsToMedia(src: string): string {
  const pathname = pathOnly(src);
  const match = pathname.match(/^\/uploads\/([^/]+)$/i);
  if (!match?.[1]) {
    return src;
  }
  const file = match[1];
  if (!file || file.includes("..") || file.includes("\\")) {
    return src;
  }
  // Preserve query/hash only for relative upload paths.
  if (src.startsWith("/uploads/")) {
    const suffix = src.slice(pathname.length);
    return `/media/${file}${suffix}`;
  }
  return `/media/${file}`;
}

function shouldSkipOptimization(src: string): boolean {
  if (src.startsWith("blob:") || src.startsWith("data:")) {
    return true;
  }
  const pathname = pathOnly(src);
  if (pathname.toLowerCase().endsWith(".svg")) {
    return true;
  }
  if (/^https?:\/\//i.test(src)) {
    try {
      const host = new URL(src).hostname;
      return !OPTIMIZABLE_REMOTE_HOSTS.has(host);
    } catch {
      return true;
    }
  }
  return false;
}

/**
 * CMS / storefront image — skips render when src is missing so Next/Image never gets "".
 *
 * `/uploads/*` is rewritten to `/media/*` so the Next image optimizer can read files
 * via the local route handler. Static `/assets/*` stay as public paths.
 */
export function CmsImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  sizes,
  priority,
  preload,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  /** Next 16 preload — prefer over priority for LCP images. */
  preload?: boolean;
}) {
  const resolved = resolvePublicAssetSrc(String(src ?? "").trim());
  if (!resolved) {
    return null;
  }

  const optimizedSrc = rewriteUploadsToMedia(resolved);
  const props: ImageProps = {
    src: optimizedSrc,
    alt,
  };

  if (shouldSkipOptimization(optimizedSrc)) {
    props.unoptimized = true;
  }

  if (className) {
    props.className = className;
  }
  if (sizes) {
    props.sizes = sizes;
  }
  // Next forbids priority + preload together; map priority → preload for LCP.
  if (preload || priority) {
    props.preload = true;
  }
  if (fill) {
    props.fill = true;
  } else {
    props.width = width ?? 304;
    props.height = height ?? 637;
  }
  return <Image {...props} alt={alt} />;
}
