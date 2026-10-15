import { parseSchema } from "@/lib/parse-schema";
import { myOrdersQuerySchema } from "@/schemas/order";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { requirePermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";
import { orderService } from "@/server/services/orders/order.service";

export const definition: RouteDefinition = {
  method: "GET",
  path: "/admin/orders",
};

export async function handler(ctx: RequestContext) {
  await requirePermission(await authService.getUserFromSession(ctx.sessionToken), "MANAGE_ORDERS");
  const query = parseSchema(myOrdersQuerySchema, ctx.query);
  return orderService.listAdmin(query.page, query.limit, query.status, query.cursor);
}
