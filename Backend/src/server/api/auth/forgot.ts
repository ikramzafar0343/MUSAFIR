import { parseSchema } from "@/lib/parse-schema";
import { forgotPasswordSchema } from "@/schemas/auth";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/auth/forgot",
};

export async function handler(ctx: RequestContext) {
  const body = parseSchema(forgotPasswordSchema, ctx.body);
  return authService.requestPasswordReset(body.email);
}
