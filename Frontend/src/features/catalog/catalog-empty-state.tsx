import Link from "next/link";

type CatalogEmptyStateProps = {
  eyebrow: string;
  title: string;
  copy: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function CatalogEmptyState({
  eyebrow,
  title,
  copy,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: CatalogEmptyStateProps) {
  const hasActions = Boolean(primaryHref && primaryLabel);
  return (
    <div className="catalog-empty">
      <p className="catalog-empty-eyebrow">{eyebrow}</p>
      <h3 className="catalog-empty-title">{title}</h3>
      <p className="catalog-empty-copy">{copy}</p>
      {hasActions ? (
        <div className="catalog-empty-actions">
          <Link href={primaryHref!} className="luxury-button-solid">
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref} className="luxury-button-outline">
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
