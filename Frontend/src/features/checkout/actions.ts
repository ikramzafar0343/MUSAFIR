"use server";

import { redirect } from "next/navigation";

import { orderService } from "@/lib/api/orders";
import { AppError } from "@/lib/app-error";
import { writeCart } from "@/lib/cart-cookie";
import { writeOrderReceipt } from "@/lib/order-receipt-cookie";
import { parseSchema } from "@/lib/parse-schema";
import { resolveAndPruneCart } from "@/lib/resolve-cart";
import { checkoutSchema } from "@/schemas/order";

type FieldName = "fullName" | "email" | "phone" | "address" | "city" | "postalCode" | "promoCode";

export type CheckoutActionState = {
  error?: string;
  fields?: Partial<Record<FieldName, string>>;
  values?: Partial<Record<FieldName, string>>;
};

function readValues(formData: FormData): Partial<Record<FieldName, string>> {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    promoCode: String(formData.get("promoCode") ?? ""),
  };
}

function fieldErrorsFromAppError(error: AppError): Partial<Record<FieldName, string>> {
  const allowed = new Set<FieldName>(["fullName", "email", "phone", "address", "city", "postalCode", "promoCode"]);
  const fields: Partial<Record<FieldName, string>> = {};
  for (const item of error.fields) {
    const key = item.field as FieldName;
    if (allowed.has(key) && !fields[key]) {
      fields[key] = item.message;
    }
  }
  return fields;
}

export async function checkoutAction(formData: FormData): Promise<CheckoutActionState> {
  const values = readValues(formData);
  try {
    if (String(formData.get("hp_url") ?? "").trim() || String(formData.get("website") ?? "").trim()) {
      return { error: "Unable to place this order.", values };
    }

    const postedMethod = String(formData.get("paymentMethod") ?? "");
    if (postedMethod !== "cod") {
      return { error: "Cash on delivery is the only payment method available.", values };
    }

    const { items } = await resolveAndPruneCart({ persist: true });
    if (items.length === 0) {
      return { error: "Your bag is empty.", values };
    }

    const parsed = parseSchema(checkoutSchema, {
      email: values.email ?? "",
      phone: values.phone ?? "",
      fullName: values.fullName ?? "",
      address: values.address ?? "",
      city: values.city ?? "",
      postalCode: values.postalCode ?? "",
      paymentMethod: "cod",
      items,
      promoCode: values.promoCode?.trim() || undefined,
    });
    const order = await orderService.checkout(parsed);
    await writeOrderReceipt(String(order.orderNumber), String(order.email));
    await writeCart({ items: [] });
    redirect(`/order-confirmation/${String(order.orderNumber)}`);
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) {
      throw error;
    }
    if (error instanceof AppError) {
      const fields = fieldErrorsFromAppError(error);
      return {
        error:
          Object.keys(fields).length > 0
            ? "Please correct the highlighted fields."
            : error.fields[0]?.message || error.message,
        values,
        ...(Object.keys(fields).length > 0 ? { fields } : {}),
      };
    }
    return { error: error instanceof Error ? error.message : "Checkout failed", values };
  }
}
