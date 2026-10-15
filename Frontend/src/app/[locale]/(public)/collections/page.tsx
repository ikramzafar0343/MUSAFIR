import { CollectionView } from "@/features/catalog/collection-view";

export default async function CollectionsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const query = await searchParams;
  return <CollectionView category="all" sort={query.sort} page={Number(query.page ?? 1)} />;
}
