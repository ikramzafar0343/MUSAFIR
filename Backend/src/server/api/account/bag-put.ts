import { AppError } from "@/lib/app-error";
import { parseSchema } from "@/lib/parse-schema";
import { cartStateSchema } from "@/schemas/order";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";
import { bagService } from "@/server/services/bag/bag.service";

export const definition: RouteDefinition = {
  method: "PUT",
  path: "/account/bag",
};

export async function handler(ctx: RequestContext) {
  const user = await authService.getUserFromSession(ctx.sessionToken);
  if (!user) {
    throw AppError.unauthenticated();
  }
  const body = parseSchema(cartStateSchema, ctx.body);
  return { items: await bagService.upsert(user.id, body.items) };
}
