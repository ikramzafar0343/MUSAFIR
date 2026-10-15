import { DISCOUNT_TYPES } from "@/constants/catalog";

export function calculatePromoDiscount(subtotal: number, discountType: string, amount: number): number {
  const safeSubtotal = Math.max(0, subtotal);
  const safeAmount = Math.max(0, amount);
  const discount =
    discountType === DISCOUNT_TYPES.PERCENTAGE
      ? Math.round((safeSubtotal * Math.min(100, safeAmount)) / 100)
      : safeAmount;
  return Math.min(safeSubtotal, Math.round(discount));
}
