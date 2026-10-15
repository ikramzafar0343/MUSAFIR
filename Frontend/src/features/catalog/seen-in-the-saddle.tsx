"use client";

import Link from "next/link";

import {
  DEFAULT_RIDER_GALLERY,
  type StorefrontRiderGallery,
} from "@/constants/storefront";
import { GalleryVideo } from "@/features/catalog/gallery-video";
import { CmsImage } from "@/features/media/cms-image";
import { PillCta } from "@/features/motion/pill-cta";
import { isVideoSrc } from "@/lib/media-src";
import { resolvePublicAssetSrc } from "@/lib/public-assets";

type SeenInTheSaddleProps = {
  content?: StorefrontRiderGallery;
};

/** Homepage rider / product gallery driven by storefront content. */
export function SeenInTheSaddle({ content = DEFAULT_RIDER_GALLERY }: SeenInTheSaddleProps) {
  const data = content ?? DEFAULT_RIDER_GALLERY;

  return (
    <section className="home-rider-gallery" aria-labelledby="rider-gallery-title">
      <div className="home-rider-gallery-inner">
        <header className="home-rider-gallery-header">
          <h2 id="rider-gallery-title" className="home-rider-gallery-title">
            {data.title} <span className="section-mark">{data.titleMark}</span>
          </h2>
          <p className="home-rider-gallery-lead">{data.lead}</p>
        </header>

        <ul className="home-rider-gallery-grid">
          {data.items.map((item) => {
            const src = item.src?.trim();
            const resolved = src ? resolvePublicAssetSrc(src) : "";
            const video = Boolean(resolved) && isVideoSrc(resolved);
            return (
              <li
                key={item.id}
                className={`home-rider-gallery-item home-rider-gallery-item--${item.tone}${video ? " home-rider-gallery-item--video" : ""}`}
              >
                <Link href={item.href} className="home-rider-gallery-card" aria-label={item.label || item.alt}>
                  <span className="home-rider-gallery-media">
                    {resolved ? (
                      video ? (
                        <GalleryVideo
                          className="home-rider-gallery-video"
                          src={resolved}
                          {...(item.poster?.trim() ? { poster: item.poster.trim() } : {})}
                          label={item.alt || item.label}
                        />
                      ) : (
                        <CmsImage
                          src={resolved}
                          alt={item.alt}
                          fill
                          sizes="(max-width: 699px) 90vw, (max-width: 1023px) 45vw, 22vw"
                          className="home-rider-gallery-img"
                        />
                      )
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="home-rider-gallery-actions">
          <PillCta href={data.ctaHref} className="home-rider-gallery-cta">
            {data.ctaLabel}
          </PillCta>
        </div>
      </div>
    </section>
  );
}
