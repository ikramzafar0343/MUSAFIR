"use server";

import { contactService } from "@/lib/api/contact";
import { parseSchema } from "@/lib/parse-schema";
import { contactSchema } from "@/schemas/content";

export async function contactAction(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  try {
    const parsed = parseSchema(contactSchema, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
    });
    await contactService.create(parsed);
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to send your message" };
  }
}
