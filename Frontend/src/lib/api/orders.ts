import type { CommerceSettings } from "@/constants/commerce";
import type { OrderStatus } from "@/constants/order-status";
import { apiRequest, toQuery } from "@/lib/api/client";
import { sha256Hex } from "@/lib/crypto";
import type { Pagination } from "@/types/api";
import type { OrderRecord } from "@/types/order";

export type OrderListResult = {
  orders: OrderRecord[];
  pagination: Pagination;
};

export type OrderSummary = {
  orders: number;
  revenue: number;
  aov: number;
  byStatus: Array<{ status: string; count: number }>;
  topSkus: Array<{ sku: string; name: string; units: number; revenue: number }>;
};

export const orderService = {
  getCommerceSettings: async () => apiRequest<CommerceSettings>("GET", "/commerce"),
  checkout: async (payload: unknown) =>
    apiRequest<OrderRecord>("POST", "/orders", payload, { "Idempotency-Key": sha256Hex(JSON.stringify(payload)) }),
  listMine: async (_userId: string, page = 1, limit = 20, cursor?: string) =>
    apiRequest<OrderListResult>("GET", `/orders${toQuery({ page, limit, cursor })}`),
  listAdmin: async (page = 1, limit = 20, status?: string, cursor?: string) =>
    apiRequest<OrderListResult>("GET", `/admin/orders${toQuery({ page, limit, status, cursor })}`),
  getByOrderNumber: async (orderNumber: string, _user?: unknown) =>
    apiRequest<OrderRecord>("GET", `/orders/${encodeURIComponent(orderNumber)}`),
  lookupGuest: async (orderNumber: string, email: string) =>
    apiRequest<OrderRecord>("POST", "/orders/lookup", { orderNumber, email }),
  updateTracking: async (id: string, trackingNumber: string, trackingUrl: string) =>
    apiRequest<OrderRecord>("PATCH", `/admin/orders/${id}/tracking`, { trackingNumber, trackingUrl }),
  summarize: async () => apiRequest<OrderSummary>("GET", "/admin/orders/summary"),
  updateStatus: async (id: string, status: OrderStatus) =>
    apiRequest<OrderRecord>("PATCH", `/admin/orders/${id}`, { status }),
  remove: async (id: string) => apiRequest<void>("DELETE", `/admin/orders/${id}`),
};
