import { z } from "zod";

import {
  DISCOUNT_TYPES,
  FRONTEND_TO_BACKEND_CATEGORY,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS,
} from "@/constants/catalog";
import { paginationSchema, uuidSchema } from "@/schemas/common";

const frontendCategories = [
  ...new Set([...Object.keys(FRONTEND_TO_BACKEND_CATEGORY), ...PRODUCT_CATEGORIES]),
] as [string, ...string[]];

export const productListQuerySchema = paginationSchema.extend({
  category: z.enum(frontendCategories).optional(),
  bestSeller: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  stockStatus: z.enum(["in-stock", "out-of-stock", "low-stock"]).optional(),
  status: z.enum([...(Object.values(PRODUCT_STATUS) as [string, ...string[]]), "all"]).optional(),
});

export const productSearchQuerySchema = productListQuerySchema.extend({
  q: z.string().trim().min(1),
});

export const productIdParamSchema = z.object({
  id: uuidSchema,
});

export const createProductSchema = z.object({
  title: z.string().trim().min(2).max(200),
  sku: z.string().trim().toUpperCase().min(2).max(40).optional(),
  category: z.enum(PRODUCT_CATEGORIES),
  categories: z.array(z.enum(PRODUCT_CATEGORIES)).min(1).max(PRODUCT_CATEGORIES.length).optional(),
  price: z.coerce.number().min(0),
  originalPrice: z.coerce.number().min(0).nullable().optional(),
  discount: z.coerce.number().min(0).optional(),
  discountType: z.enum(Object.values(DISCOUNT_TYPES) as [string, ...string[]]).optional(),
  description: z
    .object({
      intro: z.string().trim().optional(),
      detail: z.string().trim().optional(),
      highlights: z.array(z.string().trim()).optional(),
    })
    .optional(),
  sizes: z.array(z.string().trim().min(1)).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  bestSeller: z.boolean().optional(),
  status: z.enum(Object.values(PRODUCT_STATUS) as [string, ...string[]]).optional(),
  specifications: z
    .object({
      composition: z.string().trim().optional(),
      care: z.string().trim().optional(),
      includes: z.string().trim().optional(),
    })
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().trim().min(1),
        alt: z.string().trim().optional(),
        order: z.coerce.number().int().min(0).optional(),
      }),
    )
    .optional(),
  returnPolicy: z.string().trim().optional(),
  tileColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  colors: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        hex: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/),
      }),
    )
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();
