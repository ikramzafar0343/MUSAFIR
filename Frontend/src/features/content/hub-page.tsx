import Link from "next/link";
import { notFound } from "next/navigation";

import { getHubPage } from "@/constants/navigation-ia";
import { LegalPage } from "@/features/content/legal-page";

/** Content hub for public IA paths that are not product collection grids. */
export function HubPage({ slug }: { slug: string }) {
  const hub = getHubPage(slug);
  if (!hub) {
    notFound();
  }

  return (
    <LegalPage eyebrow={hub.eyebrow} title={hub.title} lead={hub.lead}>
      {hub.body.map((paragraph) => (
        <p key={paragraph.slice(0, 48)}>{paragraph}</p>
      ))}
      {hub.links.length > 0 ? (
        <ul className="info-page-link-list">
          {hub.links.map((link) => (
            <li key={link.href + link.label}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      ) : null}
      {hub.primaryCta ? (
        <div className="info-page-actions">
          <Link href={hub.primaryCta.href} className="luxury-button-solid">
            {hub.primaryCta.label}
          </Link>
        </div>
      ) : null}
    </LegalPage>
  );
}
