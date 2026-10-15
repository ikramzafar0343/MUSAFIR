import { revalidatePath } from "next/cache";

import { LOCALES } from "@/constants/site";

export function revalidateStorefront(productId?: string): void {
  revalidatePath("/", "layout");
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}`, "layout");
  }
  if (productId) {
    revalidatePath(`/product/${productId}`);
    for (const locale of LOCALES) {
      revalidatePath(`/${locale}/product/${productId}`);
    }
  }
}
