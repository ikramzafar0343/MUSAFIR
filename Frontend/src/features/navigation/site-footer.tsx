import Link from "next/link";
import type { ComponentType } from "react";

import { IconFacebook, IconHorseshoe, IconInstagram, IconPinterest } from "@/components/icons/icons";
import { brandName, footerSocialLabel, heroCtaHref, heroExploreLabel } from "@/constants/brand";
import { FOOTER_NAV, FOOTER_SOCIAL, SUPPORT_CONTACTS, SUPPORT_EMAIL } from "@/constants/site";
import { type StorefrontContent, visibleNavLinks } from "@/constants/storefront";
import { FooterTrail } from "@/features/motion/footer-trail";
import { NewsletterForm } from "@/features/newsletter/newsletter-form";

type IconProps = { className?: string | undefined };

const SOCIAL_ICONS: Record<(typeof FOOTER_SOCIAL)[number]["icon"], ComponentType<IconProps>> = {
  facebook: IconFacebook,
  instagram: IconInstagram,
  pinterest: IconPinterest,
};

const EXPLORE_COPY = Array.from({ length: 3 }, () => `${heroExploreLabel.toUpperCase()} •`).join(" ");

function SocialBlob({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path
        d="M10 34c4-16 16-26 32-26 18 0 28 12 28 26 0 16-12 28-28 28C20 62 6 50 10 34Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SiteFooter({ content }: { content: StorefrontContent }) {
  const socialHrefs: Record<string, string> = {
    facebook: content.socialFacebook,
    instagram: content.socialInstagram,
    pinterest: content.socialPinterest,
  };
  return (
    <footer id="site-footer" className="site-footer vd-footer-trail-host">
      <FooterTrail />
      <div className="site-footer-inner">
        <Link href={heroCtaHref} className="site-footer-badge" aria-label={heroExploreLabel}>
          <span className="site-footer-badge-ring">
            <svg viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <path id="footerExplorePath" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
              </defs>
              <text className="site-footer-badge-type">
                <textPath href="#footerExplorePath">{EXPLORE_COPY}</textPath>
              </text>
            </svg>
          </span>
          <IconHorseshoe className="site-footer-badge-star" />
        </Link>
        <p className="site-footer-statement">
          <span>{content.footerStatementLead}</span>
          <span>{content.footerStatementEnd}</span>
        </p>
        <div className="footer-newsletter">
          <p className="site-footer-social-label">Stay in the Know</p>
          <NewsletterForm />
        </div>
        <div className="site-footer-social">
          <p className="site-footer-social-label">{footerSocialLabel}</p>
          <ul className="site-footer-social-list">
            {FOOTER_SOCIAL.map((item, index) => {
              const Icon = SOCIAL_ICONS[item.icon];
              return (
                <li key={item.id}>
                  <a
                    href={socialHrefs[item.id] ?? item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`site-footer-social-link site-footer-social-link--${index + 1}`}
                    aria-label={item.label}
                  >
                    <SocialBlob className="site-footer-social-blob" />
                    <Icon />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="site-footer-phones">
          <p className="site-footer-link-title">Call / WhatsApp</p>
          <ul className="site-footer-link-list">
            {SUPPORT_CONTACTS.map((item) => (
              <li key={item.id}>
                <a href={`tel:${item.e164}`} className="site-footer-link">
                  {item.display}
                </a>
                <span className="site-footer-phone-label"> {item.label}</span>
              </li>
            ))}
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="site-footer-link">
                {SUPPORT_EMAIL}
              </a>
              <span className="site-footer-phone-label"> Sales</span>
            </li>
          </ul>
        </div>
        <nav className="site-footer-links" aria-label="Footer">
          {FOOTER_NAV.map((group) => {
            const links =
              group.id === "shop"
                ? visibleNavLinks(content).map((item) => ({ label: item.label, href: item.path }))
                : group.links;
            if (links.length === 0) {
              return null;
            }
            return (
              <div key={group.id} className="site-footer-link-group">
                <p className="site-footer-link-title">{group.title}</p>
                <ul className="site-footer-link-list">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="site-footer-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>
      <p className="site-footer-mark" aria-hidden="true">
        {brandName.toUpperCase()}
      </p>
    </footer>
  );
}
