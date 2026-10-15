import { IconBalance, IconLeather, IconStitch } from "@/components/icons/icons";
import { PillCta } from "@/features/motion/pill-cta";

const FIT_TIPS = [
  {
    title: "Check the product page",
    description: "Compare the size and fit notes on each product with your usual measurements.",
    Icon: IconLeather,
  },
  {
    title: "Consider how you wear it",
    description: "Think about layering — blazers over shirts, trousers with the shoes you plan to wear.",
    Icon: IconStitch,
  },
  {
    title: "Ask when unsure",
    description: "Contact us if you need help choosing a size before you order.",
    Icon: IconBalance,
  },
] as const;

/** Size & fit pathway — tips plus link to the full size guide hub. */
export function SizeFitGuide() {
  return (
    <section className="features-section home-size-guide" aria-labelledby="size-guide-title">
      <div className="features-inner">
        <header className="features-header">
          <h2 id="size-guide-title" className="features-heading">
            Not sure what size you need?
          </h2>
          <p className="features-support">Use the fit notes on each product page, or browse our size guide.</p>
        </header>
        <ul className="features-grid">
          {FIT_TIPS.map(({ title, description, Icon }) => (
            <li key={title} className="feature-item">
              <span className="feature-icon">
                <Icon />
              </span>
              <h3 className="feature-title">{title}</h3>
              <p className="feature-desc">{description}</p>
            </li>
          ))}
        </ul>
        <div className="best-sellers-actions">
          <PillCta href="/size-guide" className="best-sellers-cta">
            View Size Guide
          </PillCta>
        </div>
      </div>
    </section>
  );
}
