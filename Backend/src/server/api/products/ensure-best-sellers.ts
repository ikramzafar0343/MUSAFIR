import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { requirePermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";
import { productService } from "@/server/services/products/product.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/products/ensure-best-sellers",
};

export async function handler(ctx: RequestContext) {
  await requirePermission(await authService.getUserFromSession(ctx.sessionToken), "MANAGE_PRODUCTS");
  return productService.ensureBestSellers();
}
