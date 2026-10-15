import type { CatalogProduct } from "@/features/catalog/product-card";
import type { SerializedProduct } from "@/types/product";

export function productImageUrls(product: SerializedProduct): string[] {
  return product.images.map((image) => image.url).filter(Boolean);
}

export function toCatalogProduct(
  product: SerializedProduct,
  options?: { hotSkus?: readonly string[] | undefined },
): CatalogProduct {
  const sku = product.sku.trim().toUpperCase();
  const pinned = Boolean(
    options?.hotSkus?.some((item) => item.trim().toUpperCase() === sku),
  );
  return {
    id: product.id,
    title: product.title,
    description: product.description.intro,
    price: product.effectivePrice,
    originalPrice: product.originalPrice,
    images: productImageUrls(product),
    tileColor: product.tileColor,
    bestSeller: product.bestSeller || pinned,
  };
}
