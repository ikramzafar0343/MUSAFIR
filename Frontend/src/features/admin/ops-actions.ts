"use server";

import { redirect } from "next/navigation";

import { ADMIN_ROLES } from "@/constants/roles";
import { promoPayloadFromForm } from "@/features/admin/parse-promo-form";
import { promoService } from "@/lib/api/promo";
import { AppError } from "@/lib/app-error";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import { getSessionUser } from "@/lib/session";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect("/admin/login");
  }
}

function isRedirect(error: unknown): boolean {
  return typeof error === "object" && error !== null && "digest" in error;
}

function actionError(error: unknown): string {
  if (error instanceof AppError) {
    if (error.statusCode === 409) {
      return "This code already exists.";
    }
    const fieldMessage = error.fields[0]?.message;
    if (fieldMessage) {
      return fieldMessage;
    }
    return error.message;
  }
  if (error instanceof Error && error.message === "Resource already exists") {
    return "This code already exists.";
  }
  return error instanceof Error ? error.message : "Promo could not be saved";
}

export async function createPromoAction(formData: FormData): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    const parsed = promoPayloadFromForm(formData);
    if ("error" in parsed) {
      return parsed;
    }
    await promoService.create(parsed);
    revalidateStorefront();
    redirect("/admin/promos");
  } catch (error) {
    if (isRedirect(error)) {
      throw error;
    }
    return { error: actionError(error) };
  }
}

export async function togglePromoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await promoService.setActive(String(formData.get("id") ?? ""), formData.get("active") === "true");
  revalidateStorefront();
  redirect("/admin/promos");
}
