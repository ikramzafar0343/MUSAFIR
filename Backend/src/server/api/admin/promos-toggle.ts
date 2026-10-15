import { z } from "zod";

import { parseSchema } from "@/lib/parse-schema";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { requirePermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";
import { promoService } from "@/server/services/promo/promo.service";

export const definition: RouteDefinition = {
  method: "PATCH",
  path: "/admin/promos/:id",
};

export async function handler(ctx: RequestContext) {
  await requirePermission(await authService.getUserFromSession(ctx.sessionToken), "MANAGE_PRODUCTS");
  const params = parseSchema(z.object({ id: z.string().uuid() }), ctx.params);
  const body = parseSchema(z.object({ active: z.boolean() }), ctx.body);
  await promoService.setActive(params.id, body.active);
  return { ok: true };
}
