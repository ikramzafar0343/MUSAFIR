import type { ComponentType } from "react";

import { IconLeather, IconShield, IconStitch, IconTruck } from "@/components/icons/icons";
import { brandName } from "@/constants/brand";
import type { StorefrontContent } from "@/constants/storefront";
import { RibbonCurve } from "@/features/catalog/ribbon-curve";

type IconProps = { className?: string | undefined };

const FEATURE_ICONS: Record<string, ComponentType<IconProps>> = {
  stitch: IconStitch,
  leather: IconLeather,
  shield: IconShield,
  truck: IconTruck,
};

export function Features({ content }: { content: StorefrontContent }) {
  return (
    <section className="features-section" id="why-musafir" aria-labelledby="features-title">
      <RibbonCurve />
      <div className="features-inner">
        <header className="features-header">
          <h2 id="features-title" className="features-heading">
            Why <span className="section-mark">{brandName}</span>
          </h2>
        </header>
        <ul className="features-grid">
          {content.features.map((feature) => {
            const Icon = FEATURE_ICONS[feature.icon] ?? IconStitch;
            return (
              <li key={feature.title} className="feature-item">
                <span className="feature-icon">
                  <Icon />
                </span>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
