import { z } from "zod";

import { AppError } from "@/lib/app-error";
import { parseSchema } from "@/lib/parse-schema";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { addressService } from "@/server/services/address/address.service";
import { authService } from "@/server/services/auth/auth.service";

const saveAddressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(40),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  isDefault: z.boolean().optional(),
});

export const definition: RouteDefinition = {
  method: "POST",
  path: "/account/addresses",
};

export async function handler(ctx: RequestContext) {
  const user = await authService.getUserFromSession(ctx.sessionToken);
  if (!user) {
    throw AppError.unauthenticated();
  }
  const body = parseSchema(saveAddressSchema, ctx.body);
  return addressService.save(user.id, {
    ...body,
    isDefault: Boolean(body.isDefault),
  });
}
