"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authApi } from "@/lib/api/auth";
import { isNextNavigationError } from "@/lib/navigation-error";
import { parseSchema } from "@/lib/parse-schema";
import { adminVerifyPasscodeSchema, loginSchema } from "@/schemas/auth";

export async function adminLoginAction(formData: FormData): Promise<{
  error?: string | undefined;
  challengeId?: string | undefined;
}> {
  try {
    const parsed = parseSchema(loginSchema, {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    return await authApi.adminLogin(parsed);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to start admin login" };
  }
}

export async function adminVerifyAction(formData: FormData): Promise<{ error?: string }> {
  try {
    const parsed = parseSchema(adminVerifyPasscodeSchema, {
      challengeId: String(formData.get("challengeId") ?? ""),
      otp: String(formData.get("otp") ?? ""),
    });
    const result = await authApi.adminVerify(parsed);
    if (!result.user?.id) {
      return { error: "Unable to start admin session" };
    }
    revalidatePath("/", "layout");
  } catch (error) {
    if (isNextNavigationError(error)) {
      throw error;
    }
    return { error: error instanceof Error ? error.message : "Invalid passcode" };
  }
  redirect("/admin");
}
