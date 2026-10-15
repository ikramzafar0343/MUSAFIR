import { AppError } from "@/lib/app-error";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";
import { bagService } from "@/server/services/bag/bag.service";

export const definition: RouteDefinition = {
  method: "GET",
  path: "/account/bag",
};

export async function handler(ctx: RequestContext) {
  const user = await authService.getUserFromSession(ctx.sessionToken);
  if (!user) {
    throw AppError.unauthenticated();
  }
  return { items: await bagService.find(user.id) };
}
