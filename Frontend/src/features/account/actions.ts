"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { addressService } from "@/lib/api/addresses";
import { authApi } from "@/lib/api/auth";
import { mergeAccountBag } from "@/lib/cart-cookie";
import { parseSchema } from "@/lib/parse-schema";
import { getSessionUser } from "@/lib/session";
import { changePasswordSchema, updateProfileSchema } from "@/schemas/auth";

export async function updateProfileAction(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  try {
    const parsed = parseSchema(updateProfileSchema, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
    });
    await authApi.updateProfile(parsed);
    revalidatePath("/account");
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update profile" };
  }
}

export async function changePasswordAction(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  try {
    const parsed = parseSchema(changePasswordSchema, {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
    await authApi.changePassword(parsed);
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update password" };
  }
}

export async function saveAddressAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  const id = String(formData.get("id") ?? "").trim();
  await addressService.save(user.id, {
    ...(id ? { id } : {}),
    label: String(formData.get("label") ?? "Home"),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    isDefault: formData.get("isDefault") === "on",
  });
  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  await addressService.remove(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/account/addresses");
}

export async function restoreBagAfterAuth(): Promise<void> {
  await mergeAccountBag();
}
