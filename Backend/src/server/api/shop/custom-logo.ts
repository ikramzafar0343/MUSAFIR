import { z } from "zod";

import { AppError } from "@/lib/app-error";
import { parseSchema } from "@/lib/parse-schema";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { uploadService } from "@/server/services/upload/upload.service";

const CUSTOM_LOGO_MAX_BYTES = 2_000_000;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const definition: RouteDefinition = {
  method: "POST",
  path: "/shop/custom-logo",
};

export async function handler(ctx: RequestContext) {
  const body = parseSchema(
    z.object({
      mimeType: z.string().min(1),
      data: z.string().min(1),
    }),
    ctx.body,
  );
  if (!ALLOWED_TYPES.has(body.mimeType)) {
    throw AppError.validation([{ field: "mimeType", message: "Use a PNG, JPG, or WebP image." }]);
  }
  let buffer: Buffer;
  try {
    buffer = Buffer.from(body.data, "base64");
  } catch {
    throw AppError.validation([{ field: "data", message: "Invalid file payload" }]);
  }
  if (buffer.length < 1) {
    throw AppError.validation([{ field: "data", message: "Empty file" }]);
  }
  if (buffer.length > CUSTOM_LOGO_MAX_BYTES) {
    throw AppError.payloadTooLarge();
  }
  return uploadService.saveImage({ mimeType: body.mimeType, data: body.data });
}
