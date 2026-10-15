import { z } from "zod";

import { parseSchema } from "@/lib/parse-schema";
import { uuidSchema } from "@/schemas/common";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { productService } from "@/server/services/products/product.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/products/by-ids",
};

export async function handler(ctx: RequestContext) {
  const body = parseSchema(z.object({ ids: z.array(uuidSchema).max(100) }), ctx.body);
  return productService.getByIds(body.ids);
}
