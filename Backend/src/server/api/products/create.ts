import { parseSchema } from "@/lib/parse-schema";
import { createProductSchema } from "@/schemas/product";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { requirePermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";
import { productService } from "@/server/services/products/product.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/products",
};

export async function handler(ctx: RequestContext) {
  await requirePermission(await authService.getUserFromSession(ctx.sessionToken), "MANAGE_PRODUCTS");
  const body = parseSchema(createProductSchema, ctx.body);
  return productService.create({ ...body });
}
