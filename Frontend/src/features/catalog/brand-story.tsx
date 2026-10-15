import { IconHorseshoe, IconLeather, IconStitch } from "@/components/icons/icons";
import {
  brandMark,
  brandStoryPortraitAlt,
  brandStoryPrimaryAlt,
  brandStorySecondaryAlt,
} from "@/constants/brand";
import type { StorefrontContent } from "@/constants/storefront";
import { CmsImage } from "@/features/media/cms-image";

function StoryBotanical({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 280 220" fill="none" aria-hidden="true">
      <path
        d="M24 188c36-72 88-108 148-64 28 22 48 16 72-18"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path d="M86 132c22-38 58-48 92-12" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
      <path d="M48 96c18-42 52-58 86-22" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function StitchCluster({ className }: { className: string }) {
  return (
    <span className={className} aria-hidden="true">
      <IconStitch />
      <IconStitch />
      <IconStitch />
    </span>
  );
}

export function BrandStory({ content }: { content: StorefrontContent }) {
  return (
    <section className="brand-story" aria-labelledby="brand-story-title">
      <StoryBotanical className="brand-story-vine brand-story-vine--tl vd-parallax-a" />
      <StoryBotanical className="brand-story-vine brand-story-vine--br vd-parallax-c" />
      <div className="brand-story-shell">
        <figure className="brand-story-still">
          <span className="brand-story-still-orb" aria-hidden="true" />
          {content.brandStorySecondarySrc ? (
            <span className="brand-story-still-product brand-story-still-product--rear">
              <CmsImage src={content.brandStorySecondarySrc} alt="" fill sizes="180px" className="brand-story-cutout" />
            </span>
          ) : null}
          {content.brandStoryPrimarySrc ? (
            <span className="brand-story-still-product brand-story-still-product--front">
              <CmsImage src={content.brandStoryPrimarySrc} alt={brandStoryPrimaryAlt} fill sizes="200px" className="brand-story-cutout" />
            </span>
          ) : null}
        </figure>
        <div className="brand-story-copy">
          <h2 id="brand-story-title" className="sr-only">
            Our story
          </h2>
          <p className="brand-story-text">
            <span className="brand-story-name">{brandMark}</span>
            <span className="brand-story-inline">
              {content.brandStoryPrimarySrc ? (
                <span className="brand-story-inline-still">
                  <CmsImage src={content.brandStoryPrimarySrc} alt={brandStoryPrimaryAlt} fill sizes="88px" className="brand-story-cutout" />
                </span>
              ) : null}
              {content.brandStorySecondarySrc ? (
                <span className="brand-story-inline-still brand-story-inline-still--mint">
                  <CmsImage src={content.brandStorySecondarySrc} alt={brandStorySecondaryAlt} fill sizes="88px" className="brand-story-cutout" />
                </span>
              ) : null}
            </span>
            {content.brandStoryLead}{" "}
            <StitchCluster className="brand-story-leaves" /> {content.brandStoryMid}{" "}
            <IconLeather className="brand-story-bloom" /> {content.brandStoryEnd}
          </p>
        </div>
        <figure className="brand-story-photo">
          <span className="brand-story-photo-clip">
            {content.brandStoryPortraitSrc ? (
              <CmsImage
                src={content.brandStoryPortraitSrc}
                alt={brandStoryPortraitAlt}
                fill
                sizes="(min-width: 1024px) 16vw, 40vw"
                className="brand-story-photo-image"
              />
            ) : null}
          </span>
          <IconHorseshoe className="brand-story-photo-bloom" />
        </figure>
      </div>
    </section>
  );
}
