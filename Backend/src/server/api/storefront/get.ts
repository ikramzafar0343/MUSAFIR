import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { storefrontService } from "@/server/services/storefront/storefront.service";

export const definition: RouteDefinition = {
  method: "GET",
  path: "/storefront",
};

export async function handler(_ctx: RequestContext) {
  return storefrontService.getFull();
}
