import type { Metadata } from "next";

import { brandName } from "@/constants/brand";
import { CollectionView } from "@/features/catalog/collection-view";
import { getStorefront } from "@/lib/storefront";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const storefront = await getStorefront();
  const seo = storefront.content.collectionSeo[category];
  const titles = storefront.content.collectionTitles[category];
  if (!seo && !titles) {
    return { title: `Collection | ${brandName}` };
  }
  const fallbackTitle = titles ? `${titles.first} ${titles.second}`.trim() : "Collection";
  return {
    title: seo?.metaTitle || `${fallbackTitle} | ${brandName}`,
    description: seo?.metaDescription || `Shop ${fallbackTitle.toLowerCase()} from ${brandName}.`,
  };
}

export default async function CollectionCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string; page?: string; look?: string }>;
}) {
  const { category } = await params;
  const query = await searchParams;
  return (
    <CollectionView
      category={category}
      sort={query.sort}
      page={Number(query.page ?? 1)}
      lookSlug={query.look}
    />
  );
}
