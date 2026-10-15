"use server";

import { revalidatePath } from "next/cache";

import { parseSchema } from "@/lib/parse-schema";
import { readWishlist, writeWishlist } from "@/lib/wishlist-cookie";
import { uuidSchema } from "@/schemas/common";

export async function toggleWishlistAction(formData: FormData): Promise<void> {
  const id = parseSchema(uuidSchema, String(formData.get("productId") ?? ""));
  const wishlist = await readWishlist();
  const next = wishlist.ids.includes(id)
    ? wishlist.ids.filter((value) => value !== id)
    : [...wishlist.ids, id];
  await writeWishlist({ ids: next });
  revalidatePath("/", "layout");
}
