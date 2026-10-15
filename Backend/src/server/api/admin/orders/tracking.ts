import { z } from "zod";

import { parseSchema } from "@/lib/parse-schema";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { requirePermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";
import { orderService } from "@/server/services/orders/order.service";

export const definition: RouteDefinition = {
  method: "PATCH",
  path: "/admin/orders/:id/tracking",
};

export async function handler(ctx: RequestContext) {
  await requirePermission(await authService.getUserFromSession(ctx.sessionToken), "MANAGE_ORDERS");
  const params = parseSchema(z.object({ id: z.string().uuid() }), ctx.params);
  const body = parseSchema(
    z.object({
      trackingNumber: z.string(),
      trackingUrl: z.string(),
    }),
    ctx.body,
  );
  return orderService.updateTracking(params.id, body.trackingNumber, body.trackingUrl);
}
