import { parseSchema } from "@/lib/parse-schema";
import { productSearchQuerySchema } from "@/schemas/product";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { productService } from "@/server/services/products/product.service";

export const definition: RouteDefinition = {
  method: "GET",
  path: "/products/suggest",
};

export async function handler(ctx: RequestContext) {
  const query = parseSchema(productSearchQuerySchema, ctx.query);
  return productService.searchStorefront(query.q, query.limit);
}
