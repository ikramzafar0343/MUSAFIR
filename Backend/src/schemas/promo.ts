import { z } from "zod";

import { DISCOUNT_TYPES } from "@/constants/catalog";

export const createPromoSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9-]{1,39}$/, "Use 2–40 letters, numbers, or hyphens"),
    discountType: z.enum([DISCOUNT_TYPES.PERCENTAGE, DISCOUNT_TYPES.FIXED]),
    amount: z.coerce.number().int().min(1),
    minSubtotal: z.coerce.number().min(0),
  })
  .refine((value) => value.discountType !== DISCOUNT_TYPES.PERCENTAGE || value.amount <= 100, {
    path: ["amount"],
    message: "Percentage cannot exceed 100",
  });
