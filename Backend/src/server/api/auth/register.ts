import { sessionCookieName } from "@/constants/cookies";
import { getEnv } from "@/lib/env";
import { parseSchema } from "@/lib/parse-schema";
import { registerSchema } from "@/schemas/auth";
import type { RouteDefinition } from "@/server/http/load-routes";
import { type RequestContext,setCookie } from "@/server/http/respond";
import { authService } from "@/server/services/auth/auth.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/auth/register",
};

export async function handler(ctx: RequestContext) {
  const body = parseSchema(registerSchema, ctx.body);
  const result = await authService.register(body);
  setCookie(ctx.res, sessionCookieName, result.sessionToken, getEnv().SESSION_TTL_SECONDS);
  return { user: result.user };
}
