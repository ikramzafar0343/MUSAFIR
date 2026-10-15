export const PRODUCT_CATEGORIES = [
  "new-arrivals",
  "coats-blazers",
  "shirts",
  "trousers",
  "shoes",
  "matching-pairs",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const DISCOUNT_TYPES = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
} as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[keyof typeof DISCOUNT_TYPES];

export const FRONTEND_TO_BACKEND_CATEGORY: Record<string, ProductCategory | null> = {
  new: "new-arrivals",
  "new-arrivals": "new-arrivals",
  "coats-blazers": "coats-blazers",
  shirts: "shirts",
  trousers: "trousers",
  shoes: "shoes",
  "matching-pairs": "matching-pairs",
  // Legacy equestrian / Zermae bookmarks → no apparel remap (null = shop all)
  saddles: null,
  bridles: null,
  halters: null,
  reins: null,
  care: null,
  "engraved-saddles": null,
  "western-saddles": null,
  "crystal-rhinestone": null,
  "studded-leather": null,
  "custom-colors": null,
  personalized: null,
  "complete-sets": "matching-pairs",
  "tack-accessories": null,
  tack: null,
  serums: null,
  creams: null,
  cleansers: null,
  body: null,
  all: null,
};

export const BACKEND_TO_FRONTEND_CATEGORY: Record<string, string> = {
  "new-arrivals": "new",
  "coats-blazers": "coats-blazers",
  shirts: "shirts",
  trousers: "trousers",
  shoes: "shoes",
  "matching-pairs": "matching-pairs",
};

export function normalizeCategoryFilter(category: string | undefined): ProductCategory | undefined {
  if (!category || category === "all") {
    return undefined;
  }
  if (Object.prototype.hasOwnProperty.call(FRONTEND_TO_BACKEND_CATEGORY, category)) {
    const mapped = FRONTEND_TO_BACKEND_CATEGORY[category];
    return mapped ?? undefined;
  }
  if ((PRODUCT_CATEGORIES as readonly string[]).includes(category)) {
    return category as ProductCategory;
  }
  return undefined;
}

export function toFrontendCategory(category: string): string {
  return BACKEND_TO_FRONTEND_CATEGORY[category] ?? category;
}

export const CATEGORY_LABELS: Record<string, string> = {
  new: "New Arrivals",
  "new-arrivals": "New Arrivals",
  "coats-blazers": "Coats & Blazers",
  shirts: "Formal Shirts",
  trousers: "Trousers",
  shoes: "Footwear",
  "matching-pairs": "Matching Sets",
  all: "Shop All",
};

export function getCategoryPath(category: string): string {
  const slug = toFrontendCategory(category);
  return `/collections/${slug}`;
}

export const PRODUCT_SPECIFICATION_FIELDS = [
  { key: "composition", label: "Fabric" },
  { key: "care", label: "Care Instructions" },
  { key: "includes", label: "Size & Fit" },
] as const;

export const PRODUCT_VOLUME_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Custom"] as const;

export function isCustomSize(size: string | null | undefined): boolean {
  return (size ?? "").trim().toLowerCase() === "custom";
}

export const DEFAULT_RETURN_POLICY = `Unused items may be exchanged within 14 days of delivery across Pakistan.
Shipping and return terms follow the published store policies.
Payment is cash on delivery unless otherwise shown at checkout.`;
