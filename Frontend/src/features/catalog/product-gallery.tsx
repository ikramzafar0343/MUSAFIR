"use client";

import { useCallback, useEffect, useState } from "react";

import { IconClose } from "@/components/icons/icons";
import { CmsImage } from "@/features/media/cms-image";
import { lockScroll } from "@/lib/scroll-lock";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const unique = images.filter((image, index) => images.indexOf(image) === index);
  const current = unique[active] ?? unique[0];
  const hasThumbs = unique.length > 1;

  const closeZoom = useCallback(() => setZoomed(false), []);

  useEffect(() => {
    if (!zoomed) {
      return undefined;
    }
    const unlock = lockScroll();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeZoom();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomed, closeZoom]);

  return (
    <div className={`product-gallery${hasThumbs ? "" : " product-gallery--solo"}`}>
      {hasThumbs ? (
        <div className="product-thumbs" role="tablist" aria-label="Product views">
          {unique.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              role="tab"
              aria-selected={active === index}
              onClick={() => setActive(index)}
              className={`product-thumb${active === index ? " product-thumb-active" : ""}`}
            >
              <CmsImage
                src={image}
                alt={`${title} view ${index + 1}`}
                width={88}
                height={88}
                className="product-thumb-image"
              />
            </button>
          ))}
        </div>
      ) : null}
      <div className="product-main-image">
        {current ? (
          <button type="button" className="product-zoom-trigger" onClick={() => setZoomed(true)} aria-label={`Enlarge ${title}`}>
            <CmsImage
              src={current}
              alt={title}
              fill
              preload
              sizes="(min-width: 1024px) 42vw, 90vw"
              className="product-main-still"
            />
          </button>
        ) : (
          <span className="product-main-empty">No image</span>
        )}
      </div>
      {zoomed && current ? (
        <div className="product-zoom">
          <button type="button" className="product-zoom-backdrop" aria-label="Close image" onClick={closeZoom} />
          <div className="product-zoom-frame" role="dialog" aria-modal="true" aria-label={title}>
            <button type="button" className="product-zoom-close" aria-label="Close image" onClick={closeZoom}>
              <IconClose />
            </button>
            <CmsImage src={current} alt={title} width={900} height={900} className="product-zoom-still" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
