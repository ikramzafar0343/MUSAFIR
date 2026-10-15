import Link from "next/link";

import { brandName } from "@/constants/brand";
import {
  DEFAULT_CUSTOM_TACK,
  type StorefrontCustomTack,
} from "@/constants/storefront";
import { CmsImage } from "@/features/media/cms-image";
import { PillCta } from "@/features/motion/pill-cta";
import { ProgressCurve } from "@/features/motion/progress-curve";

type CustomYourTackProps = {
  content?: StorefrontCustomTack;
  /** @deprecated Prefer content.image — kept for call-site compatibility. */
  image?: string;
};

/** Homepage customization showcase — curved maroon board with numbered rail + product stage. */
export function CustomYourTack({ content = DEFAULT_CUSTOM_TACK, image }: CustomYourTackProps) {
  const data = content ?? DEFAULT_CUSTOM_TACK;
  const saddleSrc = image || data.image;

  return (
    <section className="home-custom-tack" aria-labelledby="custom-tack-title">
      <ProgressCurve from="white" to="forest" />
      <div className="home-custom-tack-body">
        <div className="home-custom-tack-inner">
          <h2 id="custom-tack-title" className="home-custom-tack-title">
            {data.title}{" "}
            <span className="home-custom-tack-title-accent">{data.titleAccent}</span>
          </h2>
          <p className="home-custom-tack-lead">{data.lead}</p>

          <div className="home-custom-tack-stage">
            <span className="home-custom-tack-orb" aria-hidden="true" />
            <span className="home-custom-tack-ring" aria-hidden="true" />
            <div className="home-custom-tack-product">
              {saddleSrc ? (
                <CmsImage
                  src={saddleSrc}
                  alt={`${brandName} menswear look`}
                  width={640}
                  height={640}
                  sizes="(max-width: 640px) 42vw, 28rem"
                  className="home-custom-tack-cutout"
                />
              ) : null}
            </div>
          </div>

          <ol className="home-custom-tack-rail">
            {data.options.map((item, index) => (
              <li key={item.id} className="home-custom-tack-rail-item">
                <Link href={item.href} className="home-custom-tack-rail-link">
                  <span className="home-custom-tack-rail-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="home-custom-tack-rail-text">
                    <span className="home-custom-tack-rail-title">{item.title}</span>
                    <span className="home-custom-tack-rail-desc">{item.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          <div className="home-custom-tack-actions">
            <PillCta href={data.ctaHref} className="home-custom-tack-cta">
              {data.ctaLabel}
            </PillCta>
          </div>
        </div>
      </div>
      <ProgressCurve from="forest" to="white" />
    </section>
  );
}
