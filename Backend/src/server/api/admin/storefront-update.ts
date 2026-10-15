import { z } from "zod";

import { resolveCommerceSettings } from "@/constants/commerce";
import { resolveStorefrontTheme, type StorefrontContent } from "@/constants/storefront";
import { AppError } from "@/lib/app-error";
import { parseSchema } from "@/lib/parse-schema";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { requirePermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";
import { storefrontService } from "@/server/services/storefront/storefront.service";

export const definition: RouteDefinition = {
  method: "PUT",
  path: "/admin/storefront",
};

const CONTENT_MAX_JSON_BYTES = 1_500_000;

const REQUIRED_CONTENT_KEYS = [
  "heroHeadline",
  "shopCategories",
  "faqItems",
  "megaMenus",
  "customTack",
] as const;

const storefrontUpdateSchema = z.object({
  commerce: z.unknown().optional(),
  theme: z.unknown().optional(),
  content: z
    .record(z.string(), z.unknown())
    .refine((value) => value !== null && typeof value === "object" && !Array.isArray(value), {
      message: "content must be an object",
    }),
});

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export async function handler(ctx: RequestContext) {
  await requirePermission(await authService.getUserFromSession(ctx.sessionToken), "MANAGE_CMS");
  const body = parseSchema(storefrontUpdateSchema, ctx.body);

  const serialized = JSON.stringify(body.content);
  if (serialized.length > CONTENT_MAX_JSON_BYTES) {
    throw AppError.validation([{ field: "content", message: "Storefront content payload is too large" }]);
  }

  for (const key of REQUIRED_CONTENT_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(body.content, key)) {
      throw AppError.validation([{ field: `content.${key}`, message: `Missing required content key: ${key}` }]);
    }
  }

  // Frontend resolveStorefrontContent is authoritative — persist content as sent.
  const content = body.content as StorefrontContent;

  await storefrontService.updatePublished(
    resolveCommerceSettings(asRecord(body.commerce)),
    resolveStorefrontTheme(body.theme),
    content,
  );
  return storefrontService.getFull();
}
