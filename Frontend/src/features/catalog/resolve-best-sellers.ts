import { BEST_SELLERS } from "@/constants/site";
import { PRODUCT_CARD_COATS, resolveHorseCoatColor } from "@/constants/storefront";
import type { SerializedProduct } from "@/types/product";

export type ResolvedBestSeller = {
  key: string;
  productId: string;
  title: string;
  description: string;
  price: number;
  href: string;
  image: string;
  images: string[];
  alt: string;
  color: string;
  wished: boolean;
};

export function mergeUniqueProducts(...groups: readonly (readonly SerializedProduct[])[]): SerializedProduct[] {
  const seen = new Set<string>();
  const next: SerializedProduct[] = [];
  for (const group of groups) {
    for (const item of group) {
      if (seen.has(item.id)) {
        continue;
      }
      seen.add(item.id);
      next.push(item);
    }
  }
  return next;
}

export function resolveBestSellers(
  products: SerializedProduct[],
  wishlistIds: string[],
  colors: string[] = [],
): ResolvedBestSeller[] {
  return products
    .map((matched, index) => {
      const slot = BEST_SELLERS[index] ?? BEST_SELLERS[0];
      const urls = matched.images.map((image) => image.url).filter(Boolean);
      const images = urls.length > 0 ? urls : slot?.image ? [slot.image] : [];
      const photo = matched.images[0];
      const intro = matched.description.intro.trim();
      const fallback = PRODUCT_CARD_COATS[index % PRODUCT_CARD_COATS.length]!;
      return {
        key: matched.sku || slot?.id || matched.id,
        productId: matched.id,
        title: matched.title,
        description: intro.length > 0 ? intro : (slot?.description ?? ""),
        price: matched.effectivePrice,
        href: `/product/${matched.id}`,
        image: images[0] ?? "",
        images,
        alt: photo?.alt || matched.title,
        color: resolveHorseCoatColor(colors[index] || matched.tileColor || fallback, fallback),
        wished: wishlistIds.includes(matched.id),
      };
    })
    .filter((item) => item.productId.length > 0 && item.images.length > 0)
    .slice(0, 3);
}
