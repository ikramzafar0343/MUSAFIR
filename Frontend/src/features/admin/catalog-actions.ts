"use server";

import { redirect } from "next/navigation";

import { ORDER_STATUS, type OrderStatus } from "@/constants/order-status";
import { ADMIN_ROLES, hasAnyPermission, hasPermission, type Permission } from "@/constants/roles";
import { productIdFromForm, productPayloadFromForm } from "@/features/admin/parse-product-form";
import { orderService } from "@/lib/api/orders";
import { productService } from "@/lib/api/products";
import { AppError } from "@/lib/app-error";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import { saveUpload } from "@/lib/save-upload";
import { getSessionUser } from "@/lib/session";

function formatSaveError(error: unknown): string {
  if (error instanceof AppError) {
    if (error.fields.length > 0) {
      return error.fields.map((field) => `${field.field}: ${field.message}`).join(" · ");
    }
    return error.message;
  }
  return error instanceof Error ? error.message : "Product could not be saved";
}

async function requireAdminPermission(permission: Permission) {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.includes(user.role) || !hasPermission(user.role, permission)) {
    redirect("/admin/login");
  }
  return user;
}

async function requireAnyAdminPermission(permissions: readonly Permission[]) {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.includes(user.role) || !hasAnyPermission(user.role, permissions)) {
    redirect("/admin/login");
  }
  return user;
}

async function collectImages(formData: FormData, title: string) {
  const images: Array<{ url: string; alt: string; order: number }> = [];
  for (let index = 0; index < 8; index += 1) {
    const uploaded = await saveUpload(formData.get(`imageFile${index + 1}`) as File | null);
    const url = uploaded || String(formData.get(`imageUrl${index + 1}`) ?? "").trim();
    if (url) {
      images.push({ url, alt: title, order: index });
    }
  }
  return images;
}

export async function saveProductAction(formData: FormData): Promise<{ error?: string }> {
  try {
    const id = productIdFromForm(formData);
    if (id) {
      await requireAnyAdminPermission(["MANAGE_PRODUCTS", "MANAGE_INVENTORY"]);
    } else {
      await requireAdminPermission("MANAGE_PRODUCTS");
    }
    const payload = productPayloadFromForm(formData, await collectImages(formData, String(formData.get("title") ?? "")));
    if (id) {
      await productService.update(id, payload);
    } else {
      await productService.create(payload);
    }
    revalidateStorefront();
    redirect("/admin/inventory");
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) {
      throw error;
    }
    return { error: formatSaveError(error) };
  }
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdminPermission("MANAGE_PRODUCTS");
  const id = String(formData.get("id") ?? "");
  await productService.remove(id);
  revalidateStorefront(id);
  redirect("/admin/inventory");
}

export async function updateStockAction(formData: FormData): Promise<void> {
  await requireAnyAdminPermission(["MANAGE_PRODUCTS", "MANAGE_INVENTORY"]);
  const id = String(formData.get("productId") ?? "");
  await productService.update(id, { stock: Number(formData.get("stock") ?? 0) });
  revalidateStorefront();
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  await requireAdminPermission("MANAGE_ORDERS");
  const id = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!(Object.values(ORDER_STATUS) as string[]).includes(status)) {
    return;
  }
  await orderService.updateStatus(id, status);
  revalidateStorefront();
}

export async function updateOrderTrackingAction(formData: FormData): Promise<void> {
  await requireAdminPermission("MANAGE_ORDERS");
  await orderService.updateTracking(
    String(formData.get("orderId") ?? ""),
    String(formData.get("trackingNumber") ?? ""),
    String(formData.get("trackingUrl") ?? ""),
  );
  revalidateStorefront();
}

export async function deleteOrderAction(formData: FormData): Promise<void> {
  await requireAdminPermission("MANAGE_ORDERS");
  const id = String(formData.get("orderId") ?? "");
  await orderService.remove(id);
  revalidateStorefront();
  redirect("/admin/orders");
}
