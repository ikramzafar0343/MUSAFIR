"use server";

import { redirect } from "next/navigation";

import { ADMIN_ROLES, hasPermission } from "@/constants/roles";
import { type BackgroundRemovalResult, removeBackground } from "@/lib/api/background-removal";
import { AppError } from "@/lib/app-error";
import { getSessionUser } from "@/lib/session";

export type RemoveBackgroundActionResult =
  | { ok: true; data: BackgroundRemovalResult }
  | { ok: false; message: string };

export async function removeBackgroundAction(formData: FormData): Promise<RemoveBackgroundActionResult> {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect("/admin/login");
  }
  if (!hasPermission(user.role, "MANAGE_PRODUCTS")) {
    redirect("/admin");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1) {
    return { ok: false, message: "Choose an image to process" };
  }

  try {
    const data = await removeBackground(file);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AppError) {
      if (error.fields.length > 0) {
        return {
          ok: false,
          message: error.fields.map((field) => `${field.field}: ${field.message}`).join(" · "),
        };
      }
      return { ok: false, message: error.message };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Background removal failed",
    };
  }
}
