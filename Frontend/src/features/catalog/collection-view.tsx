import Link from "next/link";
import { notFound } from "next/navigation";

import { brandName } from "@/constants/brand";
import { normalizeCategoryFilter } from "@/constants/catalog";
import { COLLECTION_HEROES } from "@/constants/site";
import { CatalogEmptyState } from "@/features/catalog/catalog-empty-state";
import { toCatalogProduct } from "@/features/catalog/map-product";
import type { CatalogProduct } from "@/features/catalog/product-card";
import { ProductGrid } from "@/features/catalog/product-grid";
import { RitualFeature } from "@/features/catalog/ritual-feature";
import { CmsImage } from "@/features/media/cms-image";
import { productService } from "@/lib/api/products";
import { getStorefront } from "@/lib/storefront";
import { readWishlist } from "@/lib/wishlist-cookie";

const SORTS = [
  { id: "newest", label: "Newest", sort: "createdAt", order: "desc" as const },
  { id: "price-asc", label: "Price low to high", sort: "price", order: "asc" as const },
  { id: "price-desc", label: "Price high to low", sort: "price", order: "desc" as const },
  { id: "title", label: "Name", sort: "title", order: "asc" as const },
];

const BEST_SELLERS_HERO = {
  first: "Best",
  second: "Sellers",
  image: "/assets/images/musafir-collection.png",
  alt: `${brandName} best sellers`,
  tone: "mint" as const,
};

export async function CollectionView({
  category,
  page = 1,
  sort = "newest",
  bestSeller = false,
  lookSlug,
}: {
  category: string;
  page?: number | undefined;
  sort?: string | undefined;
  bestSeller?: boolean | undefined;
  lookSlug?: string | undefined;
}) {
  if (!bestSeller && !(category in COLLECTION_HEROES)) {
    notFound();
  }

  const slug = bestSeller ? "best-sellers" : category;
  const hero = bestSeller ? BEST_SELLERS_HERO : COLLECTION_HEROES[slug];
  if (!hero) {
    notFound();
  }

  const selected = SORTS.find((item) => item.id === sort) ?? SORTS[0];
  const currentPage = Math.max(1, page);
  const basePath = bestSeller ? "/best-sellers" : `/collections/${slug}`;

  const [result, wishlist, storefront] = await Promise.all([
    productService.list({
      ...(bestSeller
        ? { bestSeller: true }
        : { category: normalizeCategoryFilter(slug) }),
      limit: 24,
      page: currentPage,
      sort: selected?.sort,
      order: selected?.order,
    }),
    readWishlist(),
    getStorefront(),
  ]);

  let products: CatalogProduct[] = result.products.map((item) =>
    toCatalogProduct(item, { hotSkus: storefront.content.bestSellerSkus }),
  );
  let totalPages = result.pagination.totalPages;
  let paginationPage = result.pagination.page;
  let hasPrev = result.pagination.hasPrev;
  let hasNext = result.pagination.hasNext;

  const publishedLooks =
    !bestSeller && slug === "matching-pairs"
      ? storefront.content.matchingLooks
          .filter((look) => look.published)
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .slice(0, 24)
      : [];
  const activeLook =
    lookSlug && publishedLooks.length > 0
      ? publishedLooks.find((look) => look.slug === lookSlug) ?? null
      : null;

  if (activeLook && activeLook.productIds.length > 0) {
    const lookProducts = await productService.getByIds(activeLook.productIds).catch(() => []);
    const byId = new Map(lookProducts.map((item) => [item.id, item]));
    products = activeLook.productIds
      .map((id) => byId.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => toCatalogProduct(item, { hotSkus: storefront.content.bestSellerSkus }));
    totalPages = 1;
    paginationPage = 1;
    hasPrev = false;
    hasNext = false;
  }

  if (bestSeller && products.length === 0) {
    const fallback = await productService.getBySkus(storefront.content.bestSellerSkus);
    products = fallback.map((item) =>
      toCatalogProduct(item, { hotSkus: storefront.content.bestSellerSkus }),
    );
    totalPages = 1;
    paginationPage = 1;
    hasPrev = false;
    hasNext = false;
  }

  const splitIndex = Math.min(6, products.length);
  const before = products.slice(0, splitIndex);
  const after = products.slice(splitIndex);
  const heroImage =
    (bestSeller ? undefined : storefront.content.collectionImages[slug]) ?? hero.image;
  const heroPoster = bestSeller
    ? undefined
    : storefront.content.collectionImagePosters[slug]?.trim() || undefined;
  const titles = bestSeller
    ? { first: BEST_SELLERS_HERO.first, second: BEST_SELLERS_HERO.second }
    : (storefront.content.collectionTitles[slug] ?? {
        first: hero.first,
        second: hero.second,
      });

  return (
    <div className="min-h-screen bg-brand-bg">
      <section className={`collection-hero collection-hero--${hero.tone}`}>
        <div className="collection-hero-stage" aria-hidden="true">
          <div className="collection-hero-pill" />
          <CmsImage
            src={heroImage}
            alt=""
            width={304}
            height={637}
            preload
            sizes="(max-width: 767px) 12rem, 18rem"
            className="collection-hero-product"
          />
        </div>
        <div className="collection-hero-copy">
          <h1 className="collection-hero-title">
            {titles.first} <span className="collection-hero-title-accent">{titles.second}</span>
          </h1>
        </div>
        <div className="collection-hero-fade" aria-hidden="true" />
      </section>
      <section className="collection-catalog">
        {!bestSeller && !activeLook && storefront.content.collectionSeo[slug]?.intro ? (
          <p className="features-support">{storefront.content.collectionSeo[slug]?.intro}</p>
        ) : null}
        {activeLook ? (
          <div style={{ marginBottom: "1.5rem" }}>
            <p className="features-support">
              <Link href="/collections/matching-pairs" className="features-card-link">
                All matching sets
              </Link>
            </p>
            <h2 className="features-card-title">{activeLook.title}</h2>
            {activeLook.description ? <p className="features-card-copy">{activeLook.description}</p> : null}
            <p className="features-card-copy">Add each piece separately — live price and stock on every product.</p>
          </div>
        ) : null}
        {!activeLook && publishedLooks.length > 0 ? (
          <div className="features-grid" style={{ marginBottom: "2rem" }}>
            {publishedLooks.map((look) => (
              <article key={look.id} className="features-card">
                {look.coverSrc ? (
                  <CmsImage
                    src={look.coverSrc}
                    alt=""
                    width={480}
                    height={360}
                    sizes="(max-width: 767px) 90vw, 20rem"
                    className="features-card-image"
                  />
                ) : null}
                <h2 className="features-card-title">{look.title}</h2>
                {look.description ? <p className="features-card-copy">{look.description}</p> : null}
                <p className="features-card-copy">
                  {look.productIds.length} piece{look.productIds.length === 1 ? "" : "s"} — prices and sizes on each product.
                </p>
                <Link href={`/collections/matching-pairs?look=${encodeURIComponent(look.slug)}`} className="features-card-link">
                  View look
                </Link>
              </article>
            ))}
          </div>
        ) : null}
        {products.length > 0 ? (
          <nav className="collection-sort" aria-label="Sort">
            {SORTS.map((item) => (
              <Link
                key={item.id}
                href={`${basePath}?sort=${item.id}`}
                className={item.id === selected?.id ? "collection-sort-active" : "collection-sort-link"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
        {before.length > 0 ? (
          <ProductGrid
            products={before}
            wishlistIds={wishlist.ids}
            currency={storefront.commerce.currency}
            tileColors={storefront.content.productCardColors}
          />
        ) : null}
        {products.length > 0 ? (
          <RitualFeature
            image={heroImage}
            {...(heroPoster ? { poster: heroPoster } : {})}
            alt={hero.alt}
            tone={hero.tone}
            category={bestSeller ? "all" : slug}
          />
        ) : null}
        {after.length > 0 ? (
          <ProductGrid
            products={after}
            wishlistIds={wishlist.ids}
            currency={storefront.commerce.currency}
            tileColors={storefront.content.productCardColors}
          />
        ) : null}
        {products.length === 0 && publishedLooks.length === 0 ? (
          <CatalogEmptyState
            eyebrow="Collection"
            title={slug === "matching-pairs" ? "No matching sets yet" : "No products in this collection"}
            copy={
              slug === "matching-pairs"
                ? "Curated looks will appear here once published in admin. Browse the full shop meanwhile."
                : "Products for this collection are not listed yet. Browse the full shop or check new arrivals while we prepare more."
            }
            primaryHref="/collections/all"
            primaryLabel="Shop All"
            secondaryHref="/collections/new"
            secondaryLabel="New Arrivals"
          />
        ) : null}
        {totalPages > 1 ? (
          <nav className="collection-pager" aria-label="Pages">
            {hasPrev ? (
              <Link href={`${basePath}?sort=${selected?.id ?? "newest"}&page=${currentPage - 1}`}>
                Previous
              </Link>
            ) : null}
            <span>
              Page {paginationPage} of {totalPages}
            </span>
            {hasNext ? (
              <Link href={`${basePath}?sort=${selected?.id ?? "newest"}&page=${currentPage + 1}`}>
                Next
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
