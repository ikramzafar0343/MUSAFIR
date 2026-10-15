import { AppError } from "@/lib/app-error";
import { parseSchema } from "@/lib/parse-schema";
import { checkoutSchema } from "@/schemas/order";
import type { RouteDefinition } from "@/server/http/load-routes";
import { header, type RequestContext } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";
import { orderService } from "@/server/services/orders/order.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/orders",
};

export async function handler(ctx: RequestContext) {
  const user = await authService.getUserFromSession(ctx.sessionToken);
  const body = parseSchema(checkoutSchema, ctx.body);
  const idempotencyKey = header(ctx.headers, "idempotency-key");
  if (!idempotencyKey) {
    throw AppError.validation([{ field: "Idempotency-Key", message: "Required" }]);
  }
  return orderService.checkout(body, user?.id ?? null, idempotencyKey);
}
