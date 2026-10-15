import type { PoolClient } from "pg";

import { AppError } from "@/lib/app-error";
import { parseLineCustomization } from "@/schemas/order";
import { decodeCursor, encodeCursor, paginate } from "@/server/database/cursor";
import { query } from "@/server/database/query";
import type { Pagination } from "@/types/api";
import type { OrderItemRecord, OrderRecord } from "@/types/order";

export type OrderSqlRow = {
  id: string;
  order_number: string;
  account_id: string | null;
  customer: string;
  email: string;
  phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  payment_method: string;
  status: string;
  subtotal: string;
  shipping_fee: string;
  tax_amount: string;
  tax_rate: string;
  tax_label: string;
  currency: string;
  total: string;
  discount_amount: string;
  promo_code: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
};

export type OrderItemSqlRow = {
  sales_order_id: string;
  product_id: string;
  name: string;
  sku: string;
  quantity: number;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  price: string;
  image_url: string | null;
  customization: unknown;
};

const ORDER_COLUMNS = `id, order_number, account_id, customer, email, phone, shipping_address, shipping_city,
  shipping_postal_code, payment_method, status, subtotal, shipping_fee, tax_amount, tax_rate, tax_label, currency, total,
  discount_amount, promo_code, tracking_number, tracking_url, notes, cancelled_at, cancellation_reason, version,
  created_at, updated_at`;

function money(value: string | number): number {
  return Number(value);
}

function toOrder(row: OrderSqlRow, items: readonly OrderItemRecord[]): OrderRecord {
  return {
    id: row.id,
    _id: row.id,
    orderNumber: row.order_number,
    userId: row.account_id,
    customer: row.customer,
    email: row.email,
    phone: row.phone,
    shipping: {
      address: row.shipping_address,
      city: row.shipping_city,
      postalCode: row.shipping_postal_code,
    },
    paymentMethod: row.payment_method,
    status: row.status,
    items,
    subtotal: money(row.subtotal),
    shippingFee: money(row.shipping_fee),
    taxAmount: money(row.tax_amount),
    taxRate: money(row.tax_rate),
    taxLabel: row.tax_label,
    currency: row.currency,
    total: money(row.total),
    discountAmount: money(row.discount_amount ?? 0),
    promoCode: row.promo_code,
    trackingNumber: row.tracking_number,
    trackingUrl: row.tracking_url,
    notes: row.notes,
    cancelledAt: row.cancelled_at ? row.cancelled_at.toISOString() : null,
    cancellationReason: row.cancellation_reason,
    version: Number(row.version),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toItem(row: OrderItemSqlRow): OrderItemRecord {
  return {
    productId: row.product_id,
    name: row.name,
    sku: row.sku,
    quantity: Number(row.quantity),
    size: row.size,
    color: row.color,
    colorHex: row.color_hex,
    price: money(row.price),
    imageUrl: row.image_url,
    customization: parseLineCustomization(row.customization),
  };
}

export type OrderWrite = {
  orderNumber: string;
  accountId: string | null;
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: string;
  status: string;
  items: readonly OrderItemRecord[];
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  taxRate: number;
  taxLabel: string;
  currency: string;
  total: number;
  discountAmount: number;
  promoCode: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
};

export class OrderRepository {
  async attachItems(rows: OrderSqlRow[], client?: PoolClient): Promise<OrderRecord[]> {
    if (rows.length === 0) {
      return [];
    }
    const ids = rows.map((row) => row.id);
    const items = await query<OrderItemSqlRow>(
      `SELECT sales_order_id, product_id, name, sku, quantity, size, color, color_hex, price, image_url, customization
       FROM sales_order_item
       WHERE sales_order_id = ANY($1::uuid[])
       ORDER BY created_at ASC`,
      [ids],
      client,
    );
    const byOrder = new Map<string, OrderItemRecord[]>();
    for (const item of items.rows) {
      const list = byOrder.get(item.sales_order_id) ?? [];
      list.push(toItem(item));
      byOrder.set(item.sales_order_id, list);
    }
    return rows.map((row) => toOrder(row, byOrder.get(row.id) ?? []));
  }

  async insert(input: OrderWrite, client: PoolClient): Promise<OrderRecord> {
    const inserted = await query<OrderSqlRow>(
      `INSERT INTO sales_order (
         order_number, account_id, customer, email, phone, shipping_address, shipping_city,
         shipping_postal_code, payment_method, status, subtotal, shipping_fee, tax_amount,
         tax_rate, tax_label, currency, total, notes, discount_amount, promo_code, tracking_number, tracking_url
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING ${ORDER_COLUMNS}`,
      [
        input.orderNumber,
        input.accountId,
        input.customer,
        input.email,
        input.phone,
        input.address,
        input.city,
        input.postalCode,
        input.paymentMethod,
        input.status,
        input.subtotal,
        input.shippingFee,
        input.taxAmount,
        input.taxRate,
        input.taxLabel,
        input.currency,
        input.total,
        input.notes,
        input.discountAmount,
        input.promoCode,
        input.trackingNumber,
        input.trackingUrl,
      ],
      client,
    );
    const row = inserted.rows[0];
    if (!row) {
      throw new Error("Order insert returned no row");
    }
    if (input.items.length > 0) {
      const values: unknown[] = [];
      const placeholders = input.items.map((item, index) => {
        const offset = index * 11;
        values.push(
          row.id,
          item.productId,
          item.name,
          item.sku,
          item.quantity,
          item.size,
          item.color,
          item.colorHex,
          item.price,
          item.imageUrl,
          item.customization ? JSON.stringify(item.customization) : null,
        );
        return `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6},$${offset + 7},$${offset + 8},$${offset + 9},$${offset + 10},$${offset + 11}::jsonb)`;
      });
      await query(
        `INSERT INTO sales_order_item (
           sales_order_id, product_id, name, sku, quantity, size, color, color_hex, price, image_url, customization
         ) VALUES ${placeholders.join(", ")}`,
        values,
        client,
      );
    }
    const [created] = await this.attachItems([row], client);
    if (!created) {
      throw new Error("Order insert could not be reloaded");
    }
    return created;
  }

  async findPage(params: {
    page: number;
    limit: number;
    cursor?: string | undefined;
    accountId?: string | undefined;
    status?: string | undefined;
  }): Promise<{ orders: OrderRecord[]; pagination: Pagination }> {
    const limit = Math.min(Math.max(1, params.limit), 100);
    const page = Math.max(1, params.page);
    const values: unknown[] = [];
    const where = ["deleted_at IS NULL"];
    if (params.accountId) {
      values.push(params.accountId);
      where.push(`account_id = $${values.length}`);
    }
    if (params.status) {
      values.push(params.status);
      where.push(`status = $${values.length}`);
    }
    const decoded = params.cursor ? decodeCursor(params.cursor) : null;
    if (decoded) {
      values.push(decoded.createdAt, decoded.id);
      where.push(`(created_at, id) < ($${values.length - 1}, $${values.length})`);
    }
    const whereSql = where.join(" AND ");
    const countValues = values.slice(0, decoded ? values.length - 2 : values.length);
    const countWhere = decoded ? where.slice(0, -1).join(" AND ") : whereSql;
    const offset = decoded ? 0 : (page - 1) * limit;
    values.push(limit + 1, offset);
    const result = await query<OrderSqlRow>(
      `SELECT ${ORDER_COLUMNS} FROM sales_order
       WHERE ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    const count = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM sales_order WHERE ${countWhere}`,
      countValues,
    );
    const hasExtra = result.rows.length > limit;
    const pageRows = hasExtra ? result.rows.slice(0, limit) : result.rows;
    const orders = await this.attachItems(pageRows);
    const last = pageRows[pageRows.length - 1];
    const nextCursor = hasExtra && last ? encodeCursor(last.created_at, last.id) : null;
    return { orders, pagination: paginate(page, limit, Number(count.rows[0]?.total ?? 0), nextCursor) };
  }

  async findByOrderNumber(orderNumber: string, accountId: string): Promise<OrderRecord | null> {
    const result = await query<OrderSqlRow>(
      `SELECT ${ORDER_COLUMNS} FROM sales_order
       WHERE deleted_at IS NULL
         AND order_number = $1
         AND account_id = $2
       LIMIT 1`,
      [orderNumber.toUpperCase(), accountId],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    const [order] = await this.attachItems([row]);
    return order ?? null;
  }

  async findByOrderNumberUnscoped(orderNumber: string): Promise<OrderRecord | null> {
    const result = await query<OrderSqlRow>(
      `SELECT ${ORDER_COLUMNS} FROM sales_order
       WHERE deleted_at IS NULL
         AND order_number = $1
       LIMIT 1`,
      [orderNumber.toUpperCase()],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    const [order] = await this.attachItems([row]);
    return order ?? null;
  }

  async findByEmailAndNumber(orderNumber: string, email: string): Promise<OrderRecord | null> {
    const result = await query<OrderSqlRow>(
      `SELECT ${ORDER_COLUMNS} FROM sales_order
       WHERE deleted_at IS NULL
         AND order_number = $1
         AND lower(email) = lower($2)
       LIMIT 1`,
      [orderNumber.toUpperCase(), email.trim()],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    const [order] = await this.attachItems([row]);
    return order ?? null;
  }

  async findById(id: string): Promise<OrderRecord | null> {
    const result = await query<OrderSqlRow>(
      `SELECT ${ORDER_COLUMNS} FROM sales_order WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    const [order] = await this.attachItems([row]);
    return order ?? null;
  }

  async updateStatus(id: string, status: string, version: number, cancelledAt: Date | null): Promise<OrderRecord> {
    const result = await query<OrderSqlRow>(
      `UPDATE sales_order
       SET status = $2, cancelled_at = $3, version = version + 1
       WHERE id = $1 AND deleted_at IS NULL AND version = $4
       RETURNING ${ORDER_COLUMNS}`,
      [id, status, cancelledAt, version],
    );
    const row = result.rows[0];
    if (!row) {
      throw AppError.conflict("Order was updated by another request");
    }
    const [order] = await this.attachItems([row]);
    if (!order) {
      throw AppError.notFound("Order not found");
    }
    return order;
  }

  async updateTracking(
    id: string,
    trackingNumber: string | null,
    trackingUrl: string | null,
    version: number,
  ): Promise<OrderRecord> {
    const result = await query<OrderSqlRow>(
      `UPDATE sales_order
       SET tracking_number = $2, tracking_url = $3, version = version + 1
       WHERE id = $1 AND deleted_at IS NULL AND version = $4
       RETURNING ${ORDER_COLUMNS}`,
      [id, trackingNumber, trackingUrl, version],
    );
    const row = result.rows[0];
    if (!row) {
      throw AppError.conflict("Order was updated by another request");
    }
    const [order] = await this.attachItems([row]);
    if (!order) {
      throw AppError.notFound("Order not found");
    }
    return order;
  }

  async softDeleteById(id: string, client?: PoolClient): Promise<boolean> {
    const result = await query(
      `UPDATE sales_order
       SET deleted_at = NOW(), version = version + 1
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
      client,
    );
    return (result.rowCount ?? 0) > 0;
  }

  async summarize(): Promise<{
    orders: number;
    revenue: number;
    aov: number;
    byStatus: Array<{ status: string; count: number }>;
    topSkus: Array<{ sku: string; name: string; units: number; revenue: number }>;
  }> {
    const totals = await query<{ orders: string; revenue: string; aov: string }>(
      `SELECT COUNT(*)::text AS orders,
              COALESCE(SUM(total), 0)::text AS revenue,
              COALESCE(AVG(total), 0)::text AS aov
       FROM sales_order
       WHERE deleted_at IS NULL AND status <> 'cancelled'`,
    );
    const statusRows = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::text AS count
       FROM sales_order
       WHERE deleted_at IS NULL
       GROUP BY status
       ORDER BY count DESC`,
    );
    const skuRows = await query<{ sku: string; name: string; units: string; revenue: string }>(
      `SELECT i.sku, i.name, SUM(i.quantity)::text AS units, COALESCE(SUM(i.price * i.quantity), 0)::text AS revenue
       FROM sales_order_item i
       INNER JOIN sales_order o ON o.id = i.sales_order_id
       WHERE o.deleted_at IS NULL AND o.status <> 'cancelled'
       GROUP BY i.sku, i.name
       ORDER BY SUM(i.quantity) DESC
       LIMIT 8`,
    );
    const row = totals.rows[0];
    return {
      orders: Number(row?.orders ?? 0),
      revenue: Number(row?.revenue ?? 0),
      aov: Number(row?.aov ?? 0),
      byStatus: statusRows.rows.map((item) => ({ status: item.status, count: Number(item.count) })),
      topSkus: skuRows.rows.map((item) => ({
        sku: item.sku,
        name: item.name,
        units: Number(item.units),
        revenue: Number(item.revenue),
      })),
    };
  }
}

export const orderRepository = new OrderRepository();
