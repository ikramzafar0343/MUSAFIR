import { calculatePromoDiscount } from "@/constants/promo";
import { AppError } from "@/lib/app-error";
import { promoRepository } from "@/server/database/repositories/promo/promo.repository";

export type PromoPreview = {
  code: string;
  discountType: string;
  amount: number;
  discount: number;
};

export class PromoService {
  async list() {
    return promoRepository.list();
  }

  async create(input: { code: string; discountType: string; amount: number; minSubtotal: number }) {
    return promoRepository.insert({
      code: input.code,
      discountType: input.discountType,
      amount: input.amount,
      minSubtotal: input.minSubtotal,
      active: true,
    });
  }

  async setActive(id: string, active: boolean) {
    const row = await promoRepository.setActive(id, active);
    if (!row) {
      throw AppError.notFound("Promo code not found");
    }
    return row;
  }

  async preview(code: string, subtotal: number): Promise<PromoPreview> {
    const row = await promoRepository.findActiveByCode(code);
    if (!row) {
      throw AppError.validation([{ field: "promoCode", message: "This code is not valid" }]);
    }
    if (subtotal < Number(row.min_subtotal)) {
      throw AppError.validation([
        { field: "promoCode", message: `This code applies from ${Number(row.min_subtotal).toLocaleString()}` },
      ]);
    }
    const amount = Number(row.amount);
    return {
      code: row.code,
      discountType: row.discount_type,
      amount,
      discount: calculatePromoDiscount(subtotal, row.discount_type, amount),
    };
  }
}

export const promoService = new PromoService();
