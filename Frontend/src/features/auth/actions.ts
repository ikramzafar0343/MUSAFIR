"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { sessionCookieName } from "@/constants/cookies";
import { authApi } from "@/lib/api/auth";
import { mergeAccountBag } from "@/lib/cart-cookie";
import { isNextNavigationError } from "@/lib/navigation-error";
import { parseSchema } from "@/lib/parse-schema";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/schemas/auth";

export async function registerAction(formData: FormData): Promise<{ error?: string }> {
  try {
    const parsed = parseSchema(registerSchema, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
    await authApi.register(parsed);
    await mergeAccountBag();
    revalidatePath("/", "layout");
  } catch (error) {
    if (isNextNavigationError(error)) {
      throw error;
    }
    return { error: error instanceof Error ? error.message : "Unable to register" };
  }
  redirect("/account");
}

export async function loginAction(formData: FormData): Promise<{ error?: string }> {
  try {
    const parsed = parseSchema(loginSchema, {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    await authApi.login(parsed);
    await mergeAccountBag();
    revalidatePath("/", "layout");
  } catch (error) {
    if (isNextNavigationError(error)) {
      throw error;
    }
    return { error: error instanceof Error ? error.message : "Unable to sign in" };
  }
  redirect("/account");
}

export async function logoutAction(): Promise<void> {
  try {
    await authApi.logout();
  } catch {
    const store = await cookies();
    store.delete(sessionCookieName);
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPasswordAction(formData: FormData): Promise<{
  error?: string;
  ok?: boolean;
  resetPath?: string;
}> {
  try {
    const parsed = parseSchema(forgotPasswordSchema, { email: String(formData.get("email") ?? "") });
    const result = await authApi.forgot(parsed);
    return result.resetPath ? { ok: true, resetPath: result.resetPath } : { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to start a reset" };
  }
}

export async function resetPasswordAction(formData: FormData): Promise<{ error?: string }> {
  try {
    const parsed = parseSchema(resetPasswordSchema, {
      token: String(formData.get("token") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
    await authApi.reset(parsed);
  } catch (error) {
    if (isNextNavigationError(error)) {
      throw error;
    }
    return { error: error instanceof Error ? error.message : "Unable to update password" };
  }
  redirect("/login");
}
