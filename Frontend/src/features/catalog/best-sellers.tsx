"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BEST_SELLERS_CTA, BEST_SELLERS_CTA_HREF } from "@/constants/site";
import { CatalogEmptyState } from "@/features/catalog/catalog-empty-state";
import { ProductCard } from "@/features/catalog/product-card";
import type { ResolvedBestSeller } from "@/features/catalog/resolve-best-sellers";
import { PillCta } from "@/features/motion/pill-cta";

const BEST_SELLERS_LIMIT = 3;

/**
 * Best-sellers rail — same native scroll-snap feel as category cards on mobile.
 * No JS transform drag: the browser owns the swipe, which stays smooth on iOS/Android.
 */
export function BestSellers({ items, currency = "USD" }: { items: ResolvedBestSeller[]; currency?: string }) {
  const products = items.slice(0, BEST_SELLERS_LIMIT);
  const empty = products.length === 0;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    // When every card fits (desktop centered row), arrows stay off.
    if (max <= 4) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    setCanPrev(viewport.scrollLeft > 4);
    setCanNext(viewport.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || empty) {
      return;
    }
    sync();
    viewport.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      viewport.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync, empty, products.length]);

  const scrollByCard = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const card = viewport.querySelector<HTMLElement>(".vd-card-entrance");
    const track = viewport.querySelector<HTMLElement>(".best-sellers-rail-track");
    const style = track ? window.getComputedStyle(track) : null;
    const gap = style ? Number.parseFloat(style.columnGap || style.gap || "28") || 28 : 28;
    const step = card ? card.getBoundingClientRect().width + gap : viewport.clientWidth * 0.85;
    viewport.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <section className="best-sellers" aria-labelledby="best-sellers-title">
      <div className="best-sellers-wash vd-parallax-a" aria-hidden="true" />
      <div className="best-sellers-blob best-sellers-blob--mint vd-parallax-b" aria-hidden="true" />
      <div className="best-sellers-blob best-sellers-blob--blush vd-parallax-c" aria-hidden="true" />
      <div className="best-sellers-inner">
        <header className="best-sellers-header">
          <h2 id="best-sellers-title" className="best-sellers-title">
            <span className="section-mark">Customer favorites</span> worth a closer look
          </h2>
          <p className="best-sellers-support">
            Discover pieces from the collection that pair well on their own — and even better together.
          </p>
        </header>
        {empty ? (
          <CatalogEmptyState
            eyebrow="Bestsellers"
            title="No products yet"
            copy="Bestsellers will appear here once products are published. Explore new arrivals while we finish curating this selection."
            primaryHref="/collections/all"
            primaryLabel="Shop All"
            secondaryHref="/collections/new"
            secondaryLabel="New Arrivals"
          />
        ) : (
          <>
            <div className="best-sellers-rail">
              <div className="best-sellers-rail-controls">
                <button
                  type="button"
                  className="best-sellers-rail-btn"
                  aria-label="Previous products"
                  disabled={!canPrev}
                  onClick={() => scrollByCard(-1)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="best-sellers-rail-btn"
                  aria-label="Next products"
                  disabled={!canNext}
                  onClick={() => scrollByCard(1)}
                >
                  ›
                </button>
              </div>
              <div
                ref={viewportRef}
                className="best-sellers-rail-viewport"
                role="region"
                aria-roledescription="carousel"
                aria-label="Best sellers"
              >
                <div
                  className={`best-sellers-rail-track${products.length <= 3 ? " is-centered" : ""}`}
                >
                  {products.map((item) => (
                    <div key={item.key} className="vd-card-entrance">
                      <ProductCard
                        wished={item.wished}
                        currency={currency}
                        ctaLabel="Shop"
                        color={item.color}
                        hot
                        product={{
                          id: item.productId,
                          title: item.title,
                          description: item.description,
                          price: item.price,
                          images: item.images,
                          tileColor: item.color,
                          bestSeller: true,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="best-sellers-actions">
              <PillCta href={BEST_SELLERS_CTA_HREF} className="best-sellers-cta">
                {BEST_SELLERS_CTA}
              </PillCta>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
