import { z } from "zod";

import { parseSchema } from "@/lib/parse-schema";
import { emailSchema } from "@/schemas/common";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { orderService } from "@/server/services/orders/order.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/orders/lookup",
};

export async function handler(ctx: RequestContext) {
  const body = parseSchema(
    z.object({
      orderNumber: z.string().trim().min(1),
      email: emailSchema,
    }),
    ctx.body,
  );
  return orderService.lookupGuest(body.orderNumber, body.email);
}
