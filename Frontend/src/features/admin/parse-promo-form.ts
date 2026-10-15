import { DISCOUNT_TYPES, type DiscountType } from "@/constants/catalog";

export type PromoWrite = {
  code: string;
  discountType: DiscountType;
  amount: number;
  minSubtotal: number;
};

export function promoPayloadFromForm(formData: FormData): PromoWrite | { error: string } {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{1,39}$/.test(code)) {
    return { error: "Use 2–40 letters, numbers, or hyphens." };
  }
  const discountType =
    String(formData.get("discountType") ?? "") === DISCOUNT_TYPES.FIXED
      ? DISCOUNT_TYPES.FIXED
      : DISCOUNT_TYPES.PERCENTAGE;
  const amount = Number(formData.get("amount") ?? 0);
  if (!Number.isInteger(amount) || amount < 1) {
    return { error: "Amount must be a whole number of at least 1." };
  }
  if (discountType === DISCOUNT_TYPES.PERCENTAGE && amount > 100) {
    return { error: "Percentage cannot exceed 100." };
  }
  const minSubtotal = Number(formData.get("minSubtotal") ?? 0);
  if (!Number.isFinite(minSubtotal) || minSubtotal < 0) {
    return { error: "Minimum subtotal cannot be negative." };
  }
  return { code, discountType, amount, minSubtotal };
}
