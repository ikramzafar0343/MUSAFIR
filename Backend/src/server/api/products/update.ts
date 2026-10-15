import { parseSchema } from "@/lib/parse-schema";
import { productIdParamSchema, updateProductSchema } from "@/schemas/product";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { requireAnyPermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";
import { productService } from "@/server/services/products/product.service";

export const definition: RouteDefinition = {
  method: "PATCH",
  path: "/products/:id",
};

export async function handler(ctx: RequestContext) {
  await requireAnyPermission(await authService.getUserFromSession(ctx.sessionToken), ["MANAGE_PRODUCTS","MANAGE_INVENTORY"]);
  const params = parseSchema(productIdParamSchema, ctx.params);
  const body = parseSchema(updateProductSchema, ctx.body);
  return productService.update(params.id, { ...body });
}
