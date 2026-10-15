import { parseSchema } from "@/lib/parse-schema";
import { loginSchema } from "@/schemas/auth";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/auth/admin/login",
};

export async function handler(ctx: RequestContext) {
  const body = parseSchema(loginSchema, ctx.body);
  return authService.requestAdminLogin(body);
}
