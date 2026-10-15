import { parseSchema } from "@/lib/parse-schema";
import { resetPasswordSchema } from "@/schemas/auth";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/auth/reset",
};

export async function handler(ctx: RequestContext) {
  const body = parseSchema(resetPasswordSchema, ctx.body);
  await authService.resetPassword(body);
  return { ok: true };
}
