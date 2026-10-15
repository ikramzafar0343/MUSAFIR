import { DISCOUNT_TYPES, toFrontendCategory } from "@/constants/catalog";
import { resolvePublicAssetSrc } from "@/lib/public-assets";
import type { ProductColor, ProductImage, ProductRecord, SerializedProduct } from "@/types/product";

export type ProductSqlRow = {
  id: string;
  title: string;
  slug: string;
  sku: string;
  category: string;
  categories: string[] | null;
  price: string;
  original_price: string | null;
  discount: string;
  discount_type: string;
  description_intro: string;
  description_detail: string;
  description_highlights: string[];
  spec_composition: string;
  spec_care: string;
  spec_includes: string;
  return_policy: string;
  sizes: string[];
  tile_color: string | null;
  best_seller: boolean;
  stock: number;
  low_stock_threshold: number;
  rating: string;
  review_count: number;
  status: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

export type ProductImageRow = {
  product_id: string;
  url: string;
  alt: string;
  sort_order: number;
};

export type ProductColorRow = {
  product_id: string;
  name: string;
  hex: string;
};

export const PRODUCT_COLUMNS = `id, title, slug, sku, category, categories, price, original_price, discount, discount_type,
  description_intro, description_detail, description_highlights, spec_composition, spec_care, spec_includes,
  return_policy, sizes, tile_color, best_seller, stock, low_stock_threshold, rating, review_count, status, version,
  created_at, updated_at`;

function money(value: string | number | null): number {
  return value === null ? 0 : Number(value);
}

function effectivePrice(price: number, discount: number, discountType: string): number {
  if (discount <= 0) {
    return price;
  }
  if (discountType === DISCOUNT_TYPES.FIXED) {
    return Math.max(0, price - discount);
  }
  return Math.max(0, price - (price * discount) / 100);
}

export function toProductRecord(
  row: ProductSqlRow,
  images: readonly ProductImage[],
  colors: readonly ProductColor[],
): ProductRecord {
  const price = money(row.price);
  const discount = money(row.discount);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    sku: row.sku,
    category: row.category,
    categories: [...new Set([row.category, ...(row.categories ?? [])])],
    price,
    originalPrice: row.original_price === null ? null : money(row.original_price),
    discount,
    discountType: row.discount_type,
    description: {
      intro: row.description_intro,
      detail: row.description_detail,
      highlights: row.description_highlights ?? [],
    },
    specifications: {
      composition: row.spec_composition,
      care: row.spec_care,
      includes: row.spec_includes,
    },
    returnPolicy: row.return_policy,
    sizes: row.sizes ?? [],
    tileColor: row.tile_color,
    colors,
    images,
    variants: [],
    bestSeller: row.best_seller,
    stock: Number(row.stock),
    lowStockThreshold: Number(row.low_stock_threshold),
    rating: money(row.rating),
    reviewCount: Number(row.review_count),
    status: row.status,
    version: Number(row.version),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    effectivePrice: effectivePrice(price, discount, row.discount_type),
  };
}

export function serializeProduct(product: ProductRecord): SerializedProduct {
  return {
    ...product,
    _id: product.id,
    category: toFrontendCategory(product.category),
    categories: [...new Set(product.categories.map(toFrontendCategory))],
    images: product.images.map((image) => ({
      ...image,
      url: resolvePublicAssetSrc(image.url),
    })),
  };
}
