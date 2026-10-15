import { z } from "zod";

import { parseSchema } from "@/lib/parse-schema";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";
import { orderService } from "@/server/services/orders/order.service";

export const definition: RouteDefinition = {
  method: "GET",
  path: "/orders/:orderNumber",
};

export async function handler(ctx: RequestContext) {
  const user = await authService.getUserFromSession(ctx.sessionToken);
  const params = parseSchema(z.object({ orderNumber: z.string().min(1) }), ctx.params);
  return orderService.getByOrderNumber(params.orderNumber, user);
}
