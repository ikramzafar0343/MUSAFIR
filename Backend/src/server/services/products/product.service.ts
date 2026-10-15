import { DEFAULT_RETURN_POLICY, DISCOUNT_TYPES, normalizeCategoryFilter, PRODUCT_STATUS } from "@/constants/catalog";
import { BEST_SELLERS } from "@/constants/site";
import { AppError } from "@/lib/app-error";
import type { DbClient } from "@/server/database/query";
import { serializeProduct } from "@/server/database/repositories/product/product.mapper";
import { productRepository, type ProductWrite } from "@/server/database/repositories/product/product.repository";
import type { ProductColor, ProductImage, ProductRecord, SerializedProduct } from "@/types/product";

const SORT_FIELDS = ["createdAt", "price", "title", "stock"] as const;

function generateSku(title: string): string {
  const base = title
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  const suffix = Date.now().toString(36).toUpperCase().slice(-4);
  return `ZM-${base || "CARE"}-${suffix}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function asTileColor(value: unknown, fallback: string | null): string | null {
  if (value === undefined) {
    return fallback;
  }
  if (value === null || value === "") {
    return null;
  }
  const text = String(value).trim();
  return /^#[0-9A-Fa-f]{6}$/.test(text) ? text : fallback;
}

/** Primary category first. A payload that sends only `category` replaces the list with that one category. */
function productCategories(payload: Record<string, unknown>, existing?: ProductRecord): string[] {
  const listed = payload.categories === undefined ? null : asStringArray(payload.categories);
  const primary =
    payload.category !== undefined ? String(payload.category) : (listed?.[0] ?? existing?.category ?? "");
  const rest = listed ?? (payload.category !== undefined ? [] : [...(existing?.categories ?? [])]);
  return [...new Set([primary, ...rest].map((item) => item.trim()).filter(Boolean))];
}

function toWrite(payload: Record<string, unknown>, slug: string, sku: string, existing?: ProductRecord): ProductWrite {
  const description = asRecord(payload.description ?? existing?.description);
  const specifications = asRecord(payload.specifications ?? existing?.specifications);
  const imagesRaw = (payload.images as ProductImage[] | undefined) ?? existing?.images ?? [];
  const colorsRaw = (payload.colors as ProductColor[] | undefined) ?? existing?.colors ?? [];
  const categories = productCategories(payload, existing);
  return {
    title: String(payload.title ?? existing?.title ?? ""),
    slug,
    sku,
    category: categories[0] ?? "",
    categories,
    price: Number(payload.price ?? existing?.price ?? 0),
    originalPrice:
      payload.originalPrice === undefined
        ? (existing?.originalPrice ?? Number(payload.price ?? existing?.price ?? 0))
        : payload.originalPrice === null
          ? null
          : Number(payload.originalPrice),
    discount: Number(payload.discount ?? existing?.discount ?? 0),
    discountType: String(payload.discountType ?? existing?.discountType ?? DISCOUNT_TYPES.PERCENTAGE),
    descriptionIntro: String(description.intro ?? ""),
    descriptionDetail: String(description.detail ?? ""),
    descriptionHighlights: asStringArray(description.highlights),
    specComposition: String(specifications.composition ?? ""),
    specCare: String(specifications.care ?? ""),
    specIncludes: String(specifications.includes ?? ""),
    returnPolicy:
      String(payload.returnPolicy ?? existing?.returnPolicy ?? DEFAULT_RETURN_POLICY).trim() || DEFAULT_RETURN_POLICY,
    sizes: (() => {
      const sizes = asStringArray(payload.sizes ?? existing?.sizes);
      const volume = String(specifications.includes ?? existing?.specifications.includes ?? "").trim();
      return sizes.length > 0 ? sizes : volume ? [volume] : [];
    })(),
    tileColor: asTileColor(payload.tileColor, existing?.tileColor ?? null),
    bestSeller: Boolean(payload.bestSeller ?? existing?.bestSeller ?? false),
    stock: Number(payload.stock ?? existing?.stock ?? 0),
    status: String(payload.status ?? existing?.status ?? PRODUCT_STATUS.DRAFT),
    images: imagesRaw.map((image, index) => ({
      url: image.url,
      alt: image.alt ?? "",
      order: image.order ?? index,
    })),
    colors: colorsRaw.map((color) => ({ name: color.name, hex: color.hex })),
  };
}

export class ProductService {
  async list(query: {
    page?: number | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
    category?: string | undefined;
    search?: string | undefined;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    bestSeller?: boolean | undefined;
    status?: string | undefined;
  }) {
    const sort = SORT_FIELDS.includes(query.sort as (typeof SORT_FIELDS)[number])
      ? (query.sort as (typeof SORT_FIELDS)[number])
      : "createdAt";
    const result = await productRepository.findPage({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      cursor: query.cursor,
      category: normalizeCategoryFilter(query.category),
      status: query.status === "all" ? undefined : (query.status ?? PRODUCT_STATUS.PUBLISHED),
      bestSeller: query.bestSeller,
      search: query.search,
      sort,
      order: query.order === "asc" ? "ASC" : "DESC",
    });
    return {
      products: result.docs.map(serializeProduct),
      pagination: result.pagination,
    };
  }

  async bestSellers(query: { page?: number | undefined; limit?: number | undefined; cursor?: string | undefined }) {
    return this.list({
      page: query.page,
      limit: query.limit ?? 12,
      cursor: query.cursor,
      bestSeller: true,
    });
  }

  async details(id: string): Promise<SerializedProduct> {
    const product = await this.assertPublished(id);
    return serializeProduct(product);
  }

  async getAdmin(id: string): Promise<SerializedProduct> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw AppError.notFound("Product not found");
    }
    return serializeProduct(product);
  }

  async searchStorefront(query: string, limit = 8): Promise<SerializedProduct[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return [];
    }
    const docs = await productRepository.searchStorefront(trimmed, limit);
    return docs.map(serializeProduct);
  }

  async getByIds(ids: string[], client?: DbClient): Promise<SerializedProduct[]> {
    const docs = await productRepository.findByIds(ids, client);
    return docs.filter((item) => item.status === PRODUCT_STATUS.PUBLISHED).map(serializeProduct);
  }

  async getPublishedByIds(ids: string[], client?: DbClient): Promise<SerializedProduct[]> {
    return this.getByIds(ids, client);
  }

  async getBySkus(skus: string[]): Promise<SerializedProduct[]> {
    const normalized = [
      ...new Set(skus.map((sku) => String(sku ?? "").trim().toUpperCase()).filter(Boolean)),
    ];
    if (normalized.length === 0) {
      return [];
    }
    const docs = await productRepository.findBySkus(normalized);
    const bySku = new Map(docs.map((doc) => [doc.sku.toUpperCase(), doc]));
    return normalized
      .map((sku) => bySku.get(sku))
      .filter((record): record is ProductRecord => Boolean(record && record.status === PRODUCT_STATUS.PUBLISHED))
      .map(serializeProduct);
  }

  async assertPublished(id: string, client?: DbClient): Promise<ProductRecord> {
    const product = await productRepository.findById(id, client);
    if (!product || product.status !== PRODUCT_STATUS.PUBLISHED) {
      throw AppError.notFound("Product not found");
    }
    return product;
  }

  async reserveStock(id: string, quantity: number, client: DbClient): Promise<ProductRecord> {
    return productRepository.decrementStock(id, quantity, client);
  }

  async releaseStock(id: string, quantity: number, client?: DbClient): Promise<void> {
    await productRepository.incrementStock(id, quantity, client);
  }

  async ensureBestSellers(): Promise<SerializedProduct[]> {
    const items: SerializedProduct[] = [];
    for (const slot of BEST_SELLERS) {
      const active = await productRepository.findBySku(slot.sku);
      if (active) {
        if (active.status === PRODUCT_STATUS.PUBLISHED) {
          items.push(serializeProduct(active));
        }
        continue;
      }

      // Soft-deleted (or otherwise removed) SKUs must never be recreated by storefront traffic.
      const existing = await productRepository.findBySkuIncludingDeleted(slot.sku);
      if (existing) {
        continue;
      }

      const slug = await productRepository.generateUniqueSlug(slot.title);
      const record = await productRepository.create({
        title: slot.title,
        slug,
        sku: slot.sku,
        category: slot.category,
        categories: [slot.category],
        price: slot.price,
        originalPrice: null,
        discount: 0,
        discountType: DISCOUNT_TYPES.PERCENTAGE,
        descriptionIntro: slot.description,
        descriptionDetail: slot.description,
        descriptionHighlights: [],
        specComposition: "",
        specCare: "",
        specIncludes: "M",
        returnPolicy: DEFAULT_RETURN_POLICY,
        sizes: [],
        tileColor: null,
        bestSeller: true,
        stock: 80,
        status: PRODUCT_STATUS.PUBLISHED,
        images: [{ url: slot.image, alt: slot.alt, order: 0 }],
        colors: [],
      });
      items.push(serializeProduct(record));
    }
    return items;
  }

  async create(payload: Record<string, unknown>): Promise<SerializedProduct> {
    const title = String(payload.title ?? "");
    const requested = typeof payload.sku === "string" ? payload.sku.trim().toUpperCase() : "";
    let sku = requested
      ? requested.startsWith("ZM-")
        ? requested
        : `ZM-${requested}`
      : generateSku(title);
    if (await productRepository.skuExists(sku)) {
      sku = generateSku(title);
    }
    const slug = await productRepository.generateUniqueSlug(title);
    const created = await productRepository.create(toWrite(payload, slug, sku));
    return serializeProduct(created);
  }

  async update(id: string, payload: Record<string, unknown>): Promise<SerializedProduct> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Product not found");
    }
    if (typeof payload.sku === "string" && payload.sku !== existing.sku) {
      if (await productRepository.skuExists(payload.sku, id)) {
        throw AppError.conflict("SKU already exists");
      }
    }
    const slug =
      typeof payload.title === "string" && !payload.slug
        ? await productRepository.generateUniqueSlug(payload.title, id)
        : existing.slug;
    const sku = typeof payload.sku === "string" ? payload.sku.toUpperCase() : existing.sku;
    const updated = await productRepository.updateById(id, toWrite(payload, slug, sku, existing), existing.version);
    return serializeProduct(updated);
  }

  async remove(id: string) {
    const deleted = await productRepository.softDeleteById(id);
    if (!deleted) {
      throw AppError.notFound("Product not found");
    }
    return { id, deleted: true };
  }
}

export { serializeProduct };
export const productService = new ProductService();
