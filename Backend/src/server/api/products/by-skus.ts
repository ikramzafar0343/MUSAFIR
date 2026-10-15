import { z } from "zod";

import { parseSchema } from "@/lib/parse-schema";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { productService } from "@/server/services/products/product.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/products/by-skus",
};

export async function handler(ctx: RequestContext) {
  const body = parseSchema(z.object({ skus: z.array(z.string().min(1)).max(50) }), ctx.body);
  return productService.getBySkus(body.skus);
}
