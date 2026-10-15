import Link from "next/link";
import type { ComponentType } from "react";

import {
  IconHorse,
  IconHorseshoe,
  IconLeather,
  IconShield,
  IconStitch,
} from "@/components/icons/icons";
import { Logo } from "@/components/ui/logo";
import {
  SHOP_RANGE_CATEGORIES,
  SHOP_RANGE_SIGNATURE,
  SHOP_RANGE_SUPPORT,
  SHOP_RANGE_TITLE,
  SHOP_RANGE_TRUST,
} from "@/constants/site";
import type { StorefrontShopCategory } from "@/constants/storefront";
import { CatalogEmptyState } from "@/features/catalog/catalog-empty-state";
import { ShopRangeSlider } from "@/features/catalog/shop-range-slider";
import { CmsImage } from "@/features/media/cms-image";
import { PillCta } from "@/features/motion/pill-cta";
import { ProgressCurve } from "@/features/motion/progress-curve";

type IconProps = { className?: string | undefined };

const TRUST_ICONS: Record<string, ComponentType<IconProps>> = {
  leather: IconLeather,
  stitch: IconStitch,
  shield: IconShield,
  horse: IconHorse,
};

function RangeBotanical({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 180 120" fill="none" aria-hidden="true">
      <path
        d="M12 96c28-48 62-62 98-28 18 16 34 12 52-16"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path d="M58 70c14-22 36-26 56-8" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
    </svg>
  );
}

const CATEGORY_CTA = Object.fromEntries(
  SHOP_RANGE_CATEGORIES.map((item) => [item.id, "cta" in item ? String(item.cta) : "Explore"]),
);

export function ShopByCategory({ categories }: { categories: StorefrontShopCategory[] }) {
  return (
    <section className="shop-range" aria-labelledby="shop-range-title">
      <ProgressCurve from="white" to="cream" />
      <div className="shop-range-blob shop-range-blob--mint vd-parallax-a" aria-hidden="true" />
      <div className="shop-range-blob shop-range-blob--blush vd-parallax-c" aria-hidden="true" />
      <RangeBotanical className="shop-range-vine shop-range-vine--tl vd-parallax-b" />
      <RangeBotanical className="shop-range-vine shop-range-vine--br vd-parallax-a" />
      <div className="shop-range-inner">
        <header className="shop-range-header">
          <p className="shop-range-eyebrow">
            <span className="shop-range-eyebrow-line" />
            <span className="shop-range-eyebrow-copy">
              Explore <IconHorseshoe className="shop-range-eyebrow-mark" /> our range
            </span>
            <span className="shop-range-eyebrow-line" />
          </p>
          <h2 id="shop-range-title" className="shop-range-title">
            {SHOP_RANGE_TITLE}
          </h2>
          <p className="shop-range-support">{SHOP_RANGE_SUPPORT}</p>
        </header>
        {categories.length === 0 ? (
          <CatalogEmptyState
            eyebrow="Categories"
            title="No categories yet"
            copy="Shop categories will appear here once they are published. Meanwhile, browse the full collection."
            primaryHref="/collections/all"
            primaryLabel="Shop All"
          />
        ) : (
          <ShopRangeSlider>
            {categories.map((category) => (
              <div key={category.id} className="vd-card-entrance">
                <article className="shop-range-card">
                  <Link href={category.href} className="shop-range-card-hit" aria-label={category.title} />
                  <div className="shop-range-card-media" aria-hidden="true">
                    <span className="shop-range-card-glow" />
                    <span className="card-brand-chip">
                      <Logo size="product" linked={false} />
                    </span>
                    <div className="shop-range-card-product">
                      {category.image ? (
                        <CmsImage
                          src={category.image}
                          alt=""
                          fill
                          sizes="(min-width: 1200px) 22vw, (min-width: 768px) 40vw, 78vw"
                          className="shop-range-card-image"
                        />
                      ) : (
                        <span className="shop-range-card-empty">No image</span>
                      )}
                    </div>
                  </div>
                  <div className="shop-range-card-copy">
                    <h3 className="shop-range-card-title">{category.title}</h3>
                    {category.description ? (
                      <p className="shop-range-card-meta">{category.description}</p>
                    ) : null}
                  </div>
                  <PillCta href={category.href} className="shop-range-card-cta">
                    {CATEGORY_CTA[category.id] ?? "Explore"}
                  </PillCta>
                </article>
              </div>
            ))}
          </ShopRangeSlider>
        )}
        <ul className="shop-range-trust">
          {SHOP_RANGE_TRUST.map((item) => {
            const TrustIcon = TRUST_ICONS[item.icon] ?? IconHorse;
            return (
              <li key={item.id} className="shop-range-trust-item">
                <span className="shop-range-trust-icon">
                  <TrustIcon />
                </span>
                <span className="shop-range-trust-copy">
                  <span className="shop-range-trust-title">{item.title}</span>
                  <span className="shop-range-trust-detail">{item.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="shop-range-signature">
          <IconHorseshoe className="shop-range-signature-mark" />
          {SHOP_RANGE_SIGNATURE}
        </p>
      </div>
      <ProgressCurve from="cream" to="white" />
    </section>
  );
}
