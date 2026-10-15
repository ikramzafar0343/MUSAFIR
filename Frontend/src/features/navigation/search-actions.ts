"use server";

import { productService } from "@/lib/api/products";
import { getStorefront } from "@/lib/storefront";

export type SearchHit = {
  id: string;
  title: string;
  sku: string;
  price: number;
  image: string | null;
  currency: string;
};

export async function searchProductsAction(query: string): Promise<SearchHit[]> {
  const [products, storefront] = await Promise.all([
    productService.searchStorefront(query, 8),
    getStorefront(),
  ]);
  return products.map((product) => ({
    id: product.id,
    title: product.title,
    sku: product.sku,
    price: product.effectivePrice,
    image: product.images[0]?.url ?? null,
    currency: storefront.commerce.currency,
  }));
}
