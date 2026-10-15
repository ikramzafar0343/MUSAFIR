import type { PoolClient } from "pg";

import { AppError } from "@/lib/app-error";
import { decodeCursor, encodeCursor, paginate } from "@/server/database/cursor";
import { query } from "@/server/database/query";
import {
  PRODUCT_COLUMNS,
  type ProductSqlRow,
  serializeProduct,
} from "@/server/database/repositories/product/product.mapper";
import {
  attachProductRelations,
  replaceProductRelations,
} from "@/server/database/repositories/product/product.relations";
import type { Pagination } from "@/types/api";
import type { ProductColor, ProductImage, ProductRecord } from "@/types/product";

const SORT_COLUMNS = {
  createdAt: "created_at",
  price: "price",
  title: "title",
  stock: "stock",
} as const;

function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type ProductWrite = {
  title: string;
  slug: string;
  sku: string;
  category: string;
  categories: readonly string[];
  price: number;
  originalPrice: number | null;
  discount: number;
  discountType: string;
  descriptionIntro: string;
  descriptionDetail: string;
  descriptionHighlights: string[];
  specComposition: string;
  specCare: string;
  specIncludes: string;
  returnPolicy: string;
  sizes: string[];
  tileColor: string | null;
  bestSeller: boolean;
  stock: number;
  status: string;
  images: readonly ProductImage[];
  colors: readonly ProductColor[];
};

export class ProductRepository {
  async findById(id: string, client?: PoolClient): Promise<ProductRecord | null> {
    const result = await query<ProductSqlRow>(
      `SELECT ${PRODUCT_COLUMNS} FROM product WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id],
      client,
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    const [mapped] = await attachProductRelations([row], client);
    return mapped ?? null;
  }

  async findByIds(ids: string[], client?: PoolClient): Promise<ProductRecord[]> {
    if (ids.length === 0) {
      return [];
    }
    const result = await query<ProductSqlRow>(
      `SELECT ${PRODUCT_COLUMNS} FROM product WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
      [ids],
      client,
    );
    return attachProductRelations(result.rows, client);
  }

  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM product
         WHERE sku = $1 AND deleted_at IS NULL AND ($2::uuid IS NULL OR id <> $2)
       ) AS exists`,
      [sku.toUpperCase().trim(), excludeId ?? null],
    );
    return Boolean(result.rows[0]?.exists);
  }

  async findBySku(sku: string, client?: PoolClient): Promise<ProductRecord | null> {
    const result = await query<ProductSqlRow>(
      `SELECT ${PRODUCT_COLUMNS} FROM product WHERE sku = $1 AND deleted_at IS NULL LIMIT 1`,
      [sku.toUpperCase().trim()],
      client,
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    const [mapped] = await attachProductRelations([row], client);
    return mapped ?? null;
  }

  async findBySkus(skus: string[], client?: PoolClient): Promise<ProductRecord[]> {
    const normalized = [
      ...new Set(skus.map((sku) => String(sku ?? "").trim().toUpperCase()).filter(Boolean)),
    ];
    if (normalized.length === 0) {
      return [];
    }
    const result = await query<ProductSqlRow>(
      `SELECT ${PRODUCT_COLUMNS} FROM product WHERE sku = ANY($1::text[]) AND deleted_at IS NULL`,
      [normalized],
      client,
    );
    return attachProductRelations(result.rows, client);
  }

  async findBySkuIncludingDeleted(sku: string, client?: PoolClient): Promise<ProductRecord | null> {
    const result = await query<ProductSqlRow>(
      `SELECT ${PRODUCT_COLUMNS} FROM product WHERE sku = $1 ORDER BY deleted_at NULLS FIRST, created_at DESC LIMIT 1`,
      [sku.toUpperCase().trim()],
      client,
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    const [mapped] = await attachProductRelations([row], client);
    return mapped ?? null;
  }

  async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const base = slugify(title);
    const result = await query<{ slug: string }>(
      `SELECT slug FROM product
       WHERE deleted_at IS NULL
         AND (slug = $1 OR slug LIKE $2)
         AND ($3::uuid IS NULL OR id <> $3)`,
      [base, `${base}-%`, excludeId ?? null],
    );
    const taken = new Set(result.rows.map((row) => row.slug));
    if (!taken.has(base)) {
      return base;
    }
    let counter = 1;
    while (taken.has(`${base}-${counter}`)) {
      counter += 1;
    }
    return `${base}-${counter}`;
  }

  async findPage(params: {
    page: number;
    limit: number;
    cursor?: string | undefined;
    category?: string | undefined;
    status?: string | undefined;
    bestSeller?: boolean | undefined;
    search?: string | undefined;
    sort: keyof typeof SORT_COLUMNS;
    order: "ASC" | "DESC";
  }): Promise<{ docs: ProductRecord[]; pagination: Pagination }> {
    const limit = Math.min(Math.max(1, params.limit), 100);
    const page = Math.max(1, params.page);
    const values: unknown[] = [];
    const where = ["deleted_at IS NULL"];
    if (params.status) {
      values.push(params.status);
      where.push(`status = $${values.length}`);
    }
    if (params.category) {
      values.push(params.category);
      where.push(`(category = $${values.length} OR categories @> ARRAY[$${values.length}]::text[])`);
    }
    if (typeof params.bestSeller === "boolean") {
      values.push(params.bestSeller);
      where.push(`best_seller = $${values.length}`);
    }
    if (params.search) {
      values.push(`%${params.search}%`);
      where.push(`(title ILIKE $${values.length} OR sku ILIKE $${values.length})`);
    }
    const decoded = params.cursor ? decodeCursor(params.cursor) : null;
    if (decoded && params.order === "DESC") {
      values.push(decoded.createdAt, decoded.id);
      where.push(`(created_at, id) < ($${values.length - 1}, $${values.length})`);
    } else if (decoded) {
      values.push(decoded.createdAt, decoded.id);
      where.push(`(created_at, id) > ($${values.length - 1}, $${values.length})`);
    }
    const sortColumn = SORT_COLUMNS[params.sort];
    const whereSql = where.join(" AND ");
    const countValues = values.slice(0, decoded ? values.length - 2 : values.length);
    const countWhere = decoded ? where.slice(0, -1).join(" AND ") : whereSql;
    const offset = decoded ? 0 : (page - 1) * limit;
    values.push(limit + 1, offset);
    const result = await query<ProductSqlRow>(
      `SELECT ${PRODUCT_COLUMNS} FROM product
       WHERE ${whereSql}
       ORDER BY ${sortColumn} ${params.order}, id ${params.order}
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    const count = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM product WHERE ${countWhere}`,
      countValues,
    );
    const hasExtra = result.rows.length > limit;
    const pageRows = hasExtra ? result.rows.slice(0, limit) : result.rows;
    const docs = await attachProductRelations(pageRows);
    const last = pageRows[pageRows.length - 1];
    const nextCursor = hasExtra && last ? encodeCursor(last.created_at, last.id) : null;
    return {
      docs,
      pagination: paginate(page, limit, Number(count.rows[0]?.total ?? 0), nextCursor),
    };
  }

  async searchStorefront(term: string, limit: number): Promise<ProductRecord[]> {
    const result = await query<ProductSqlRow>(
      `SELECT ${PRODUCT_COLUMNS} FROM product
       WHERE deleted_at IS NULL AND status = 'published' AND (title ILIKE $1 OR sku ILIKE $1)
       ORDER BY created_at DESC, id DESC
       LIMIT $2`,
      [`%${term}%`, Math.min(Math.max(1, limit), 20)],
    );
    return attachProductRelations(result.rows);
  }

  async create(input: ProductWrite, client?: PoolClient): Promise<ProductRecord> {
    const inserted = await query<ProductSqlRow>(
      `INSERT INTO product (
         title, slug, sku, category, categories, price, original_price, discount, discount_type,
         description_intro, description_detail, description_highlights,
         spec_composition, spec_care, spec_includes, return_policy, sizes, tile_color,
         best_seller, stock, status
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
       ) RETURNING ${PRODUCT_COLUMNS}`,
      [
        input.title,
        input.slug,
        input.sku,
        input.category,
        [...input.categories],
        input.price,
        input.originalPrice,
        input.discount,
        input.discountType,
        input.descriptionIntro,
        input.descriptionDetail,
        input.descriptionHighlights,
        input.specComposition,
        input.specCare,
        input.specIncludes,
        input.returnPolicy,
        input.sizes,
        input.tileColor,
        input.bestSeller,
        input.stock,
        input.status,
      ],
      client,
    );
    const row = inserted.rows[0];
    if (!row) {
      throw new Error("Product insert returned no row");
    }
    await replaceProductRelations(row.id, input.images, input.colors, client);
    const created = await this.findById(row.id, client);
    if (!created) {
      throw new Error("Product insert could not be reloaded");
    }
    return created;
  }

  async updateById(id: string, input: ProductWrite, version: number, client?: PoolClient): Promise<ProductRecord> {
    const updated = await query<ProductSqlRow>(
      `UPDATE product SET
         title = $2, slug = $3, sku = $4, category = $5, categories = $6, price = $7, original_price = $8,
         discount = $9, discount_type = $10, description_intro = $11, description_detail = $12,
         description_highlights = $13, spec_composition = $14, spec_care = $15, spec_includes = $16,
         return_policy = $17, sizes = $18, tile_color = $19, best_seller = $20, stock = $21, status = $22,
         version = version + 1
       WHERE id = $1 AND deleted_at IS NULL AND version = $23
       RETURNING ${PRODUCT_COLUMNS}`,
      [
        id,
        input.title,
        input.slug,
        input.sku,
        input.category,
        [...input.categories],
        input.price,
        input.originalPrice,
        input.discount,
        input.discountType,
        input.descriptionIntro,
        input.descriptionDetail,
        input.descriptionHighlights,
        input.specComposition,
        input.specCare,
        input.specIncludes,
        input.returnPolicy,
        input.sizes,
        input.tileColor,
        input.bestSeller,
        input.stock,
        input.status,
        version,
      ],
      client,
    );
    const row = updated.rows[0];
    if (!row) {
      throw AppError.conflict("Product was updated by another request");
    }
    await replaceProductRelations(id, input.images, input.colors, client);
    const next = await this.findById(id, client);
    if (!next) {
      throw AppError.notFound("Product not found");
    }
    return next;
  }

  async softDeleteById(id: string): Promise<boolean> {
    const result = await query(
      `UPDATE product
       SET deleted_at = NOW(), best_seller = FALSE, version = version + 1
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async decrementStock(id: string, quantity: number, client: PoolClient): Promise<ProductRecord> {
    const result = await query<ProductSqlRow>(
      `UPDATE product SET stock = stock - $2, version = version + 1
       WHERE id = $1 AND deleted_at IS NULL AND stock >= $2
       RETURNING ${PRODUCT_COLUMNS}`,
      [id, quantity],
      client,
    );
    const row = result.rows[0];
    if (!row) {
      throw AppError.validation([{ field: "items", message: "Unable to reserve stock" }]);
    }
    const [mapped] = await attachProductRelations([row], client);
    if (!mapped) {
      throw AppError.notFound("Product not found");
    }
    return mapped;
  }

  async incrementStock(id: string, quantity: number, client?: PoolClient): Promise<void> {
    await query(
      `UPDATE product SET stock = stock + $2, version = version + 1
       WHERE id = $1 AND deleted_at IS NULL`,
      [id, quantity],
      client,
    );
  }
}

export { serializeProduct };
export const productRepository = new ProductRepository();
