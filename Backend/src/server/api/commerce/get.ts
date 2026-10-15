import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { orderService } from "@/server/services/orders/order.service";

export const definition: RouteDefinition = {
  method: "GET",
  path: "/commerce",
};

export async function handler(_ctx: RequestContext) {
  return orderService.getCommerceSettings();
}
