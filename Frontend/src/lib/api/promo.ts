import { apiRequest } from "@/lib/api/client";

export type PromoRow = {
  id: string;
  code: string;
  discount_type: string;
  amount: string;
  min_subtotal: string;
  active: boolean;
};

export const promoService = {
  list: async () => apiRequest<PromoRow[]>("GET", "/admin/promos"),
  create: async (input: { code: string; discountType: string; amount: number; minSubtotal: number }) =>
    apiRequest<PromoRow>("POST", "/admin/promos", input),
  setActive: async (id: string, active: boolean) =>
    apiRequest<{ ok: boolean }>("PATCH", `/admin/promos/${id}`, { active }),
};
