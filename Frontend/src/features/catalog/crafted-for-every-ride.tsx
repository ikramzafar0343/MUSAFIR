import Link from "next/link";

import {
  DEFAULT_DISCIPLINES_SECTION,
  type StorefrontDisciplinesSection,
} from "@/constants/storefront";
import { PillCta } from "@/features/motion/pill-cta";

type CraftedForEveryRideProps = {
  content?: StorefrontDisciplinesSection;
};

/** Homepage disciplines section — content guides, not empty product grids. */
export function CraftedForEveryRide({ content = DEFAULT_DISCIPLINES_SECTION }: CraftedForEveryRideProps) {
  const data = content ?? DEFAULT_DISCIPLINES_SECTION;

  return (
    <section className="features-section home-disciplines" aria-labelledby="disciplines-title">
      <div className="features-inner home-disciplines-inner">
        <header className="features-header home-disciplines-header">
          <h2 id="disciplines-title" className="features-heading">
            {data.title} <span className="section-mark">{data.titleMark}</span>
          </h2>
          <p className="features-support">{data.support}</p>
        </header>
        <ul className="features-grid home-disciplines-grid">
          {data.items.map((item) => (
            <li key={item.id} className="feature-item home-disciplines-card">
              <h3 className="feature-title">
                <Link href={item.href}>{item.title}</Link>
              </h3>
              <p className="feature-desc">{item.description}</p>
              <p className="feature-desc home-disciplines-card-cta">
                <Link href={item.href}>{item.cta}</Link>
              </p>
            </li>
          ))}
        </ul>
        <div className="home-disciplines-actions">
          <PillCta href={data.ctaHref} className="best-sellers-cta home-disciplines-cta">
            {data.ctaLabel}
          </PillCta>
        </div>
      </div>
    </section>
  );
}
