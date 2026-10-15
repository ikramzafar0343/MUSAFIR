import { z } from "zod";

export const uuidSchema = z.string().uuid("Invalid ID");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  cursor: z.string().min(1).optional(),
});

export const emailSchema = z.string().trim().email().max(254);
export const passwordSchema = z.string().min(8).max(128);
