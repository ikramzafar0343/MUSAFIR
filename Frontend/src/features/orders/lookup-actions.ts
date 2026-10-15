"use server";

import { orderService } from "@/lib/api/orders";
import type { OrderRecord } from "@/types/order";

export async function lookupOrderAction(
  formData: FormData,
): Promise<{ error?: string; order?: OrderRecord }> {
  try {
    const order = await orderService.lookupGuest(
      String(formData.get("orderNumber") ?? ""),
      String(formData.get("email") ?? ""),
    );
    return { order };
  } catch {
    return { error: "We could not find an order with that email and number." };
  }
}
