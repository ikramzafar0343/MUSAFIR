import { DEFAULT_RETURN_POLICY, DISCOUNT_TYPES, PRODUCT_CATEGORIES, PRODUCT_STATUS, type ProductCategory } from "@/constants/catalog";
import { asHexColorOrNull } from "@/lib/hex-color";
import type { ProductColor } from "@/types/product";

export type ProductFormImage = {
  url: string;
  alt: string;
  order: number;
};

export type ProductFormPayload = {
  title: string;
  category: ProductCategory;
  categories: ProductCategory[];
  price: number;
  originalPrice: number | null;
  discount: number;
  discountType: string;
  stock: number;
  status: string;
  bestSeller: boolean;
  returnPolicy: string;
  sizes: string[];
  tileColor: string | null;
  colors: ProductColor[];
  description: {
    intro: string;
    detail: string;
    highlights: string[];
  };
  specifications: {
    composition: string;
    care: string;
    includes: string;
  };
  images: ProductFormImage[] | undefined;
};

function isCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

function asCategory(value: string): ProductCategory {
  return isCategory(value) ? value : "new-arrivals";
}

function asCategories(values: FormDataEntryValue[]): ProductCategory[] {
  return [...new Set(values.map((value) => String(value).trim()).filter(isCategory))];
}

function parseLines(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseColors(value: string): ProductColor[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, hex] = line.split("|").map((part) => part.trim());
      const color = hex && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#3f3734";
      return { name: name || "Shade", hex: color };
    });
}

export function productIdFromForm(formData: FormData): string {
  return String(formData.get("id") ?? "");
}

function asFiniteNumber(value: FormDataEntryValue | null, fallback = 0): number {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return fallback;
  }
  const next = Number(raw);
  return Number.isFinite(next) ? next : fallback;
}

export function productPayloadFromForm(formData: FormData, images: ProductFormImage[]): ProductFormPayload {
  const title = String(formData.get("title") ?? "").trim();
  const originalRaw = String(formData.get("originalPrice") ?? "").trim();
  const includes = String(formData.get("includes") ?? "").trim();
  const sizes = parseLines(String(formData.get("sizes") ?? ""));
  const returnField = formData.get("returnPolicy");
  const detail = String(formData.get("detail") ?? "");
  const introRaw = String(formData.get("intro") ?? "").trim();
  const discount = asFiniteNumber(formData.get("discount"), 0);
  const discountType = String(formData.get("discountType") ?? DISCOUNT_TYPES.PERCENTAGE);
  const price = Math.max(0, asFiniteNumber(formData.get("price"), 0));
  const stock = Math.max(0, Math.trunc(asFiniteNumber(formData.get("stock"), 0)));
  const picked = asCategories(formData.getAll("categories"));
  const category = picked[0] ?? asCategory(String(formData.get("category") ?? ""));
  const categories = picked.length > 0 ? picked : [category];
  const originalParsed = originalRaw ? asFiniteNumber(originalRaw, Number.NaN) : null;
  const safeImages = images.filter((image) => Boolean(image.url?.trim()));
  return {
    title,
    category,
    categories,
    price,
    originalPrice: discount > 0 ? price : originalParsed !== null && Number.isFinite(originalParsed) ? originalParsed : null,
    discount,
    discountType: discountType === DISCOUNT_TYPES.FIXED ? DISCOUNT_TYPES.FIXED : DISCOUNT_TYPES.PERCENTAGE,
    stock,
    status: String(formData.get("status") ?? PRODUCT_STATUS.PUBLISHED),
    bestSeller: formData.get("bestSeller") === "on",
    returnPolicy: returnField == null ? DEFAULT_RETURN_POLICY : String(returnField),
    sizes: sizes.length > 0 ? sizes : includes ? [includes] : [],
    tileColor: asHexColorOrNull(formData.get("tileColor")),
    colors: parseColors(String(formData.get("colors") ?? "")),
    description: {
      intro: introRaw || detail.slice(0, 180).trim(),
      detail,
      highlights: parseLines(String(formData.get("highlights") ?? "")),
    },
    specifications: {
      composition: String(formData.get("composition") ?? ""),
      care: String(formData.get("care") ?? ""),
      includes,
    },
    // Only send image URLs we actually have — never wipe existing photos with [].
    images: safeImages.length > 0 ? safeImages : undefined,
  };
}
