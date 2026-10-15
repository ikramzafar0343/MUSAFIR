"use server";

import { newsletterService } from "@/lib/api/newsletter";
import { parseSchema } from "@/lib/parse-schema";
import { newsletterSchema } from "@/schemas/auth";

export async function subscribeNewsletterAction(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  try {
    const parsed = parseSchema(newsletterSchema, { email: String(formData.get("email") ?? "") });
    await newsletterService.subscribe(parsed.email);
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to subscribe" };
  }
}
