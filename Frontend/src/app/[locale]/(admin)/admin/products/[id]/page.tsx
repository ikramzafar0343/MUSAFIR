import { notFound, redirect } from "next/navigation";

import { ADMIN_ROLES } from "@/constants/roles";
import { ProductForm } from "@/features/admin/product-form";
import { productService } from "@/lib/api/products";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect("/admin/login");
  }
  const { id } = await params;
  const [storefront, product] = await Promise.all([
    getStorefront(),
    productService.getAdmin(id).catch(() => null),
  ]);
  if (!product) {
    notFound();
  }
  return <ProductForm product={product} currency={storefront.commerce.currency} />;
}
