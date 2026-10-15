import { PRODUCT_CARD_COATS, resolveHorseCoatColor } from "@/constants/storefront";
import { type CatalogProduct, ProductCard } from "@/features/catalog/product-card";

const FALLBACK_COLORS = [...PRODUCT_CARD_COATS];

export function ProductGrid({
  products,
  wishlistIds,
  currency = "USD",
  tileColors,
}: {
  products: CatalogProduct[];
  wishlistIds: string[];
  columns?: 3 | 4;
  currency?: string;
  tileColors?: string[];
}) {
  const palette = tileColors && tileColors.length > 0 ? tileColors : FALLBACK_COLORS;
  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          wished={wishlistIds.includes(product.id)}
          color={resolveHorseCoatColor(
            palette[index % palette.length] || product.tileColor,
            PRODUCT_CARD_COATS[0]!,
          )}
          currency={currency}
          hot={Boolean(product.bestSeller)}
        />
      ))}
    </div>
  );
}
