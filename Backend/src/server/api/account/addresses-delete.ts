import { z } from "zod";

import { AppError } from "@/lib/app-error";
import { parseSchema } from "@/lib/parse-schema";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { addressService } from "@/server/services/address/address.service";
import { authService } from "@/server/services/auth/auth.service";

export const definition: RouteDefinition = {
  method: "DELETE",
  path: "/account/addresses/:id",
};

export async function handler(ctx: RequestContext) {
  const user = await authService.getUserFromSession(ctx.sessionToken);
  if (!user) {
    throw AppError.unauthenticated();
  }
  const params = parseSchema(z.object({ id: z.string().uuid() }), ctx.params);
  await addressService.remove(user.id, params.id);
  return { ok: true };
}
