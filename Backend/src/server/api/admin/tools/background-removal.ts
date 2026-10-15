import { z } from "zod";

import { parseSchema } from "@/lib/parse-schema";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { requirePermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";
import { backgroundRemovalService } from "@/server/services/tools/background-removal.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/admin/tools/background-removal",
};

export async function handler(ctx: RequestContext) {
  await requirePermission(await authService.getUserFromSession(ctx.sessionToken), "MANAGE_PRODUCTS");
  const body = parseSchema(
    z.object({
      mimeType: z.string().min(1),
      data: z.string().min(1),
    }),
    ctx.body,
  );
  return backgroundRemovalService.remove({
    mimeType: body.mimeType,
    data: body.data,
  });
}
