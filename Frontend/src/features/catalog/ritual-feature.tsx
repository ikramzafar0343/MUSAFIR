import type { ComponentType } from "react";

import {
  IconBalance,
  IconBridle,
  IconHalter,
  IconHorse,
  IconHorseshoe,
  IconLeather,
  IconSaddle,
  IconShield,
  IconStitch,
} from "@/components/icons/icons";
import {
  COLLECTION_RITUALS,
  RITUAL_FEATURE_MARK,
  RITUAL_FEATURE_NOTES,
  RITUAL_FEATURE_TITLE,
  type RitualIcon,
} from "@/constants/site";
import { GalleryVideo } from "@/features/catalog/gallery-video";
import { CmsImage } from "@/features/media/cms-image";
import { isVideoSrc } from "@/lib/media-src";

const RITUAL_ICONS: Record<RitualIcon, ComponentType<{ className?: string | undefined }>> = {
  leather: IconLeather,
  horse: IconHorse,
  saddle: IconSaddle,
  stitch: IconStitch,
  bridle: IconBridle,
  halter: IconHalter,
  horseshoe: IconHorseshoe,
  balance: IconBalance,
  shield: IconShield,
};

/** PNG product cutouts sit on the arch; photos and videos fill the arch frame. */
function isCutoutSrc(src: string): boolean {
  const path = src.split(/[?#]/)[0]?.toLowerCase() ?? "";
  return path.endsWith(".png");
}

export function RitualFeature({
  image,
  poster,
  alt,
  tone = "mint",
  category = "all",
}: {
  image: string;
  /** Cover frame when `image` is a video. */
  poster?: string;
  alt: string;
  tone?: "mint" | "blush" | "olive";
  category?: string;
}) {
  const ritual = COLLECTION_RITUALS[category] ?? {
    title: RITUAL_FEATURE_TITLE,
    mark: RITUAL_FEATURE_MARK,
    notes: RITUAL_FEATURE_NOTES,
  };
  const left = ritual.notes[0];
  const right = ritual.notes[1];
  const LeftIcon = RITUAL_ICONS[left.icon] ?? IconLeather;
  const RightIcon = RITUAL_ICONS[right.icon] ?? IconHorse;
  const video = Boolean(image) && isVideoSrc(image);
  const cutout = Boolean(image) && !video && isCutoutSrc(image);
  const frameClass = [
    "ritual-still-frame",
    cutout ? "ritual-still-frame--cutout" : "ritual-still-frame--fill",
    video ? "ritual-still-frame--video" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={`ritual-feature ritual-feature--${tone}`} aria-labelledby="ritual-feature-title">
      <h2 id="ritual-feature-title" className="ritual-feature-title">
        {ritual.title}{" "}
        <span className="ritual-feature-mark">{ritual.mark}</span>
      </h2>
      <div className="ritual-feature-board">
        <article className="ritual-feature-note ritual-feature-note--left">
          <span className="ritual-feature-icon">
            <LeftIcon />
          </span>
          <h3 className="ritual-feature-name">{left.title}</h3>
          <p className="ritual-feature-copy">{left.description}</p>
        </article>
        <div className="ritual-feature-stage">
          <div className={frameClass}>
            {image ? (
              video ? (
                <GalleryVideo
                  className="ritual-still-video"
                  src={image}
                  {...(poster ? { poster } : {})}
                  label={alt}
                />
              ) : (
                <CmsImage
                  src={image}
                  alt={alt}
                  fill
                  sizes="(max-width: 767px) 8rem, 12rem"
                  className="ritual-still-image"
                />
              )
            ) : null}
          </div>
        </div>
        <article className="ritual-feature-note ritual-feature-note--right">
          <span className="ritual-feature-icon">
            <RightIcon />
          </span>
          <h3 className="ritual-feature-name">{right.title}</h3>
          <p className="ritual-feature-copy">{right.description}</p>
        </article>
      </div>
    </section>
  );
}
