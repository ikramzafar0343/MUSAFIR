import { AppError } from "@/lib/app-error";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";

export const definition: RouteDefinition = {
  method: "GET",
  path: "/auth/me",
};

export async function handler(ctx: RequestContext) {
  const user = await authService.getUserFromSession(ctx.sessionToken);
  if (!user) {
    throw AppError.unauthenticated();
  }
  return { user };
}
