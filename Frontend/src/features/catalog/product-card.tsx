"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { IconHeart } from "@/components/icons/icons";
import { Logo } from "@/components/ui/logo";
import { formatMoney, tileStyle } from "@/constants/storefront";
import { CmsImage } from "@/features/media/cms-image";
import { PillCta } from "@/features/motion/pill-cta";
import { toggleWishlistAction } from "@/features/wishlist/actions";
import { cn } from "@/lib/cn";

export type ProductCardTone = "blush" | "mint" | "lavender";

export type CatalogProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number | null | undefined;
  images: string[];
  tileColor?: string | null;
  bestSeller?: boolean | undefined;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** VOLDOG soft-gray product card — same language as category cards. */
export function ProductCard({
  product,
  wished,
  color,
  currency = "USD",
  ctaLabel = "Shop",
  hot = false,
}: {
  product: CatalogProduct;
  wished: boolean;
  tone?: ProductCardTone;
  color?: string;
  currency?: string;
  ctaLabel?: string;
  hot?: boolean | undefined;
}) {
  const photos = product.images.filter(Boolean);
  const backdrop = color || product.tileColor || undefined;
  const href = `/product/${product.id}`;
  const showHot = Boolean(hot || product.bestSeller);
  const hasSale = Boolean(product.originalPrice && product.originalPrice > product.price);
  const reducedMotion = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [cycle, setCycle] = useState(0);
  const galleryCycle = hovered ? cycle : 0;

  useEffect(() => {
    if (!hovered || reducedMotion || photos.length < 3) {
      return;
    }
    const timer = window.setInterval(() => {
      setCycle((current) => current + 1);
    }, 1100);
    return () => window.clearInterval(timer);
  }, [hovered, reducedMotion, photos.length]);

  const activeIndex = (() => {
    if (photos.length < 2 || !hovered) {
      return 0;
    }
    if (reducedMotion || photos.length === 2) {
      return 1;
    }
    return (1 + galleryCycle) % photos.length;
  })();

  return (
    <article
      className={cn("product-card", photos.length > 1 && "product-card--gallery")}
      style={backdrop ? tileStyle(backdrop) : undefined}
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setCycle(0);
      }}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHovered(false);
          setCycle(0);
        }
      }}
    >
      <Link href={href} className="product-card-hit" aria-label={product.title} />
      <div className="product-card-media" aria-hidden={photos[0] ? true : undefined}>
        <span className="product-card-glow" aria-hidden="true" />
        <div className="product-card-product">
          <span className="product-card-shadow" aria-hidden="true" />
          {photos.length > 0 ? (
            // Cap at primary + active hover layer — avoid N filtered siblings.
            (activeIndex === 0 ? [0] : [0, activeIndex]).map((index) => {
              const src = photos[index];
              if (!src) {
                return null;
              }
              return (
                <CmsImage
                  key={`${src}-${index}`}
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 28vw, (min-width: 768px) 40vw, 45vw"
                  className={cn("product-card-still", index === activeIndex && "is-active")}
                />
              );
            })
          ) : (
            <span className="product-card-empty">No image</span>
          )}
        </div>
        <span className="card-brand-chip" aria-hidden="true">
          <Logo size="product" linked={false} />
        </span>
        <form action={toggleWishlistAction} className="product-card-heart-form">
          <input type="hidden" name="productId" value={product.id} />
          <button
            type="submit"
            className={cn("product-card-wishlist", wished && "is-active")}
            aria-label={wished ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
            aria-pressed={wished}
          >
            <IconHeart />
          </button>
        </form>
      </div>
      <div className="product-card-copy">
        <h3 className="product-card-name">{product.title}</h3>
        <p className="product-card-price-row">
          <span className="product-card-price-group">
            {hasSale && product.originalPrice ? (
              <span className="product-card-price-original">{formatMoney(product.originalPrice, currency)}</span>
            ) : null}
            <span className={`product-card-price${hasSale ? " product-card-price--sale" : ""}`}>
              {formatMoney(product.price, currency)}
            </span>
          </span>
          {showHot ? (
            <span className="product-card-hot" aria-label="Best seller">
              HOT
            </span>
          ) : null}
        </p>
        {product.description ? (
          <p className="product-card-desc">
            {product.description.length > 90 ? `${product.description.slice(0, 87).trimEnd()}…` : product.description}
          </p>
        ) : null}
      </div>
      <PillCta href={href} className="product-card-cta">
        {ctaLabel}
      </PillCta>
    </article>
  );
}
