import { parseSchema } from "@/lib/parse-schema";
import { contactSchema } from "@/schemas/content";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { contactService } from "@/server/services/contact/contact.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/contact",
};

export async function handler(ctx: RequestContext) {
  const body = parseSchema(contactSchema, ctx.body);
  return contactService.create(body);
}
