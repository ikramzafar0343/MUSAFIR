import { parseSchema } from "@/lib/parse-schema";
import { newsletterSchema } from "@/schemas/auth";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { newsletterService } from "@/server/services/newsletter/newsletter.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/newsletter",
};

export async function handler(ctx: RequestContext) {
  const body = parseSchema(newsletterSchema, ctx.body);
  await newsletterService.subscribe(body.email);
  return { ok: true };
}
