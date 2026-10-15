import { redirect } from "next/navigation";

import { ADMIN_ROLES } from "@/constants/roles";
import { ProductForm } from "@/features/admin/product-form";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

export default async function AdminNewProductPage() {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect("/admin/login");
  }
  const storefront = await getStorefront();
  return <ProductForm currency={storefront.commerce.currency} />;
}
