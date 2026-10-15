import { parseSchema } from "@/lib/parse-schema";
import { productIdParamSchema } from "@/schemas/product";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { productService } from "@/server/services/products/product.service";

export const definition: RouteDefinition = {
  method: "GET",
  path: "/products/:id",
};

export async function handler(ctx: RequestContext) {
  const params = parseSchema(productIdParamSchema, ctx.params);
  return productService.details(params.id);
}
