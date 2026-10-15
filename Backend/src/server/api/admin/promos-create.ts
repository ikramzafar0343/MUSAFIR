import { parseSchema } from "@/lib/parse-schema";
import { createPromoSchema } from "@/schemas/promo";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { requirePermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";
import { promoService } from "@/server/services/promo/promo.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/admin/promos",
};

export async function handler(ctx: RequestContext) {
  await requirePermission(await authService.getUserFromSession(ctx.sessionToken), "MANAGE_PRODUCTS");
  const body = parseSchema(createPromoSchema, ctx.body);
  return promoService.create(body);
}
