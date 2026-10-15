import { sessionCookieName } from "@/constants/cookies";
import type { RouteDefinition } from "@/server/http/load-routes";
import { clearCookie, type RequestContext } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/auth/logout",
};

export async function handler(ctx: RequestContext) {
  await authService.logout(ctx.sessionToken);
  clearCookie(ctx.res, sessionCookieName);
  return { ok: true };
}
