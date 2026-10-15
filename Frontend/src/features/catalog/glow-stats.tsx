import {
  GLOW_STATS_ALT,
  GLOW_STATS_COPY,
  GLOW_STATS_CTA,
  GLOW_STATS_CTA_HREF,
  GLOW_STATS_TITLE,
} from "@/constants/site";
import { CmsImage } from "@/features/media/cms-image";
import { FooterTrail } from "@/features/motion/footer-trail";
import { PillCta } from "@/features/motion/pill-cta";
import { ProgressCurve } from "@/features/motion/progress-curve";

export function GlowStats({ image }: { image: string }) {
  return (
    <section className="glow-stats vd-footer-trail-host" aria-labelledby="glow-stats-title">
      <ProgressCurve from="white" to="forest" />
      <FooterTrail />
      <div className="glow-stats-media" aria-hidden={!image}>
        {image ? (
          <CmsImage
            src={image}
            alt={GLOW_STATS_ALT}
            fill
            preload
            sizes="100vw"
            className="glow-stats-image"
          />
        ) : null}
        <span className="glow-stats-veil" />
      </div>
      <div className="glow-stats-inner">
        <div className="glow-stats-copy">
          <h2 id="glow-stats-title" className="glow-stats-title">
            <span className="section-mark">{GLOW_STATS_TITLE}</span>
          </h2>
          <p className="glow-stats-lead">{GLOW_STATS_COPY}</p>
        </div>
        <PillCta href={GLOW_STATS_CTA_HREF} className="glow-stats-cta">
          {GLOW_STATS_CTA}
        </PillCta>
      </div>
    </section>
  );
}
