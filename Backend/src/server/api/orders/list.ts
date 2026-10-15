import { AppError } from "@/lib/app-error";
import { parseSchema } from "@/lib/parse-schema";
import { myOrdersQuerySchema } from "@/schemas/order";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";
import { orderService } from "@/server/services/orders/order.service";

export const definition: RouteDefinition = {
  method: "GET",
  path: "/orders",
};

export async function handler(ctx: RequestContext) {
  const user = await authService.getUserFromSession(ctx.sessionToken);
  if (!user) {
    throw AppError.unauthenticated();
  }
  const query = parseSchema(myOrdersQuerySchema, ctx.query);
  return orderService.listMine(user.id, query.page, query.limit, query.cursor);
}
