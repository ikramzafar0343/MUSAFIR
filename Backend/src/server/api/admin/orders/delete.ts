import { parseSchema } from "@/lib/parse-schema";
import { productIdParamSchema } from "@/schemas/product";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { requirePermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";
import { orderService } from "@/server/services/orders/order.service";

export const definition: RouteDefinition = {
  method: "DELETE",
  path: "/admin/orders/:id",
};

export async function handler(ctx: RequestContext) {
  await requirePermission(await authService.getUserFromSession(ctx.sessionToken), "MANAGE_ORDERS");
  const params = parseSchema(productIdParamSchema, ctx.params);
  await orderService.remove(params.id);
}
