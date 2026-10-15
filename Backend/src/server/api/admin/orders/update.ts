import { type OrderStatus } from "@/constants/order-status";
import { parseSchema } from "@/lib/parse-schema";
import { updateOrderStatusSchema } from "@/schemas/order";
import { productIdParamSchema } from "@/schemas/product";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { requirePermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";
import { orderService } from "@/server/services/orders/order.service";

export const definition: RouteDefinition = {
  method: "PATCH",
  path: "/admin/orders/:id",
};

export async function handler(ctx: RequestContext) {
  await requirePermission(await authService.getUserFromSession(ctx.sessionToken), "MANAGE_ORDERS");
  const params = parseSchema(productIdParamSchema, ctx.params);
  const body = parseSchema(updateOrderStatusSchema, ctx.body);
  return orderService.updateStatus(params.id, body.status as OrderStatus);
}
