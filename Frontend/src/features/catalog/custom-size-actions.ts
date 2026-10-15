"use server";

import { apiRequest } from "@/lib/api/client";
import { AppError } from "@/lib/app-error";

const CUSTOM_LOGO_MAX_BYTES = 2_000_000;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export type CustomLogoUploadResult = { url?: string; error?: string };

export async function uploadCustomLogoAction(formData: FormData): Promise<CustomLogoUploadResult> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size < 1) {
    return { error: "Choose a logo image." };
  }
  if (file.size > CUSTOM_LOGO_MAX_BYTES) {
    return { error: "Logo must be 2 MB or smaller." };
  }
  const mimeType = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (!ALLOWED_TYPES.has(mimeType)) {
    return { error: "Use a PNG, JPG, or WebP image." };
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await apiRequest<{ url: string }>(
      "POST",
      "/shop/custom-logo",
      {
        mimeType,
        data: buffer.toString("base64"),
      },
      {},
      { timeoutMs: 30_000 },
    );
    return { url: result.url };
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.fields[0]?.message || error.message };
    }
    return { error: error instanceof Error ? error.message : "Unable to upload logo." };
  }
}
