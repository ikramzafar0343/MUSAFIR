import { apiRequest, toQuery } from "@/lib/api/client";
import type { Pagination } from "@/types/api";
import type { SerializedProduct } from "@/types/product";

export type ProductListQuery = {
  page?: number | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
  category?: string | undefined;
  search?: string | undefined;
  sort?: string | undefined;
  order?: "asc" | "desc" | undefined;
  bestSeller?: boolean | undefined;
  status?: string | undefined;
};

export const productService = {
  list: async (query: ProductListQuery = {}) =>
    apiRequest<{ products: SerializedProduct[]; pagination: Pagination }>("GET", `/products${toQuery(query)}`),
  details: async (id: string) => apiRequest<SerializedProduct>("GET", `/products/${id}`),
  getAdmin: async (id: string) => apiRequest<SerializedProduct>("GET", `/admin/products/${id}`),
  searchStorefront: async (query: string, limit = 8) =>
    apiRequest<SerializedProduct[]>("GET", `/products/suggest${toQuery({ q: query, limit })}`),
  getByIds: async (ids: string[]) =>
    ids.length ? apiRequest<SerializedProduct[]>("POST", "/products/by-ids", { ids }) : Promise.resolve([]),
  getBySkus: async (skus: string[]) =>
    skus.length ? apiRequest<SerializedProduct[]>("POST", "/products/by-skus", { skus }) : Promise.resolve([]),
  ensureBestSellers: async () => apiRequest<SerializedProduct[]>("POST", "/products/ensure-best-sellers", {}),
  create: async (payload: Record<string, unknown>) => apiRequest<SerializedProduct>("POST", "/products", payload),
  update: async (id: string, payload: Record<string, unknown>) =>
    apiRequest<SerializedProduct>("PATCH", `/products/${id}`, payload),
  remove: async (id: string) => apiRequest<{ id: string; deleted: boolean }>("DELETE", `/products/${id}`),
};
