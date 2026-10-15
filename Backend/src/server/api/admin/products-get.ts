import { parseSchema } from "@/lib/parse-schema";
import { productIdParamSchema } from "@/schemas/product";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { requireAnyPermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";
import { productService } from "@/server/services/products/product.service";

export const definition: RouteDefinition = {
  method: "GET",
  path: "/admin/products/:id",
};

export async function handler(ctx: RequestContext) {
  await requireAnyPermission(await authService.getUserFromSession(ctx.sessionToken), ["MANAGE_PRODUCTS","MANAGE_INVENTORY"]);
  const params = parseSchema(productIdParamSchema, ctx.params);
  return productService.getAdmin(params.id);
}
