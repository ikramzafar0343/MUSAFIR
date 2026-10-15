import { AppError } from "@/lib/app-error";
import { parseSchema } from "@/lib/parse-schema";
import { updateProfileSchema } from "@/schemas/auth";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";

export const definition: RouteDefinition = {
  method: "PATCH",
  path: "/account/profile",
};

export async function handler(ctx: RequestContext) {
  const user = await authService.getUserFromSession(ctx.sessionToken);
  if (!user) {
    throw AppError.unauthenticated();
  }
  const body = parseSchema(updateProfileSchema, ctx.body);
  return { user: await authService.updateProfile(user.id, body) };
}
