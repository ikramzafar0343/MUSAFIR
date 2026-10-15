import type { PoolClient } from "pg";

import { query } from "@/server/database/query";
import {
  type ProductColorRow,
  type ProductImageRow,
  type ProductSqlRow,
  toProductRecord,
} from "@/server/database/repositories/product/product.mapper";
import type { ProductColor, ProductImage, ProductRecord } from "@/types/product";

export async function attachProductRelations(
  rows: ProductSqlRow[],
  client?: PoolClient,
): Promise<ProductRecord[]> {
  if (rows.length === 0) {
    return [];
  }
  const ids = rows.map((row) => row.id);
  const [images, colors] = await Promise.all([
    query<ProductImageRow>(
      `SELECT product_id, url, alt, sort_order
       FROM product_image
       WHERE product_id = ANY($1::uuid[])
       ORDER BY sort_order ASC, created_at ASC`,
      [ids],
      client,
    ),
    query<ProductColorRow>(
      `SELECT product_id, name, hex FROM product_color WHERE product_id = ANY($1::uuid[])`,
      [ids],
      client,
    ),
  ]);
  const imagesByProduct = new Map<string, ProductImage[]>();
  for (const image of images.rows) {
    const list = imagesByProduct.get(image.product_id) ?? [];
    list.push({ url: image.url, alt: image.alt, order: image.sort_order });
    imagesByProduct.set(image.product_id, list);
  }
  const colorsByProduct = new Map<string, ProductColor[]>();
  for (const color of colors.rows) {
    const list = colorsByProduct.get(color.product_id) ?? [];
    list.push({ name: color.name, hex: color.hex });
    colorsByProduct.set(color.product_id, list);
  }
  return rows.map((row) =>
    toProductRecord(row, imagesByProduct.get(row.id) ?? [], colorsByProduct.get(row.id) ?? []),
  );
}

export async function replaceProductRelations(
  productId: string,
  images: readonly ProductImage[],
  colors: readonly ProductColor[],
  client?: PoolClient,
): Promise<void> {
  await query(`DELETE FROM product_image WHERE product_id = $1`, [productId], client);
  await query(`DELETE FROM product_color WHERE product_id = $1`, [productId], client);
  if (images.length > 0) {
    const imageValues: unknown[] = [];
    const imagePlaceholders = images.map((image, index) => {
      const offset = index * 4;
      imageValues.push(productId, image.url, image.alt, image.order);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
    });
    await query(
      `INSERT INTO product_image (product_id, url, alt, sort_order) VALUES ${imagePlaceholders.join(", ")}`,
      imageValues,
      client,
    );
  }
  if (colors.length > 0) {
    const colorValues: unknown[] = [];
    const colorPlaceholders = colors.map((color, index) => {
      const offset = index * 3;
      colorValues.push(productId, color.name, color.hex);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
    });
    await query(
      `INSERT INTO product_color (product_id, name, hex) VALUES ${colorPlaceholders.join(", ")}`,
      colorValues,
      client,
    );
  }
}
