import { AppError } from "@/lib/app-error";
import { parseSchema } from "@/lib/parse-schema";
import { changePasswordSchema } from "@/schemas/auth";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";

export const definition: RouteDefinition = {
  method: "PATCH",
  path: "/account/password",
};

export async function handler(ctx: RequestContext) {
  const user = await authService.getUserFromSession(ctx.sessionToken);
  if (!user) {
    throw AppError.unauthenticated();
  }
  const body = parseSchema(changePasswordSchema, ctx.body);
  await authService.changePassword(user.id, body);
  return { ok: true };
}
