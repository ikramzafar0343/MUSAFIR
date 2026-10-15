"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

/** Mobile horizontal snap slider for shop-by-category cards; desktop stays a wrap grid. */
export function ShopRangeSlider({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    setCanPrev(viewport.scrollLeft > 4);
    setCanNext(viewport.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    sync();
    viewport.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      viewport.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync, children]);

  const scrollByCard = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const card = viewport.querySelector<HTMLElement>(".vd-card-entrance");
    const step = card ? card.getBoundingClientRect().width + 14 : viewport.clientWidth * 0.8;
    viewport.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <div className="shop-range-rail">
      <div className="shop-range-rail-controls">
        <button
          type="button"
          className="shop-range-rail-btn"
          aria-label="Previous categories"
          disabled={!canPrev}
          onClick={() => scrollByCard(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="shop-range-rail-btn"
          aria-label="Next categories"
          disabled={!canNext}
          onClick={() => scrollByCard(1)}
        >
          ›
        </button>
      </div>
      <div
        ref={viewportRef}
        className="shop-range-rail-viewport"
        role="region"
        aria-roledescription="carousel"
        aria-label="Shop categories"
      >
        <div className="shop-range-track">{children}</div>
      </div>
    </div>
  );
}
