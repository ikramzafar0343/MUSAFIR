import { redirect } from "next/navigation";

import { ADMIN_ROLES } from "@/constants/roles";
import { StorefrontEditor } from "@/features/admin/storefront-editor";
import { productService } from "@/lib/api/products";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

/** Hero video prerender (server action → backend) can take up to ~2 minutes. */
export const maxDuration = 180;

export default async function AdminCustomerSidePage() {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect("/admin/login");
  }
  const [storefront, catalog] = await Promise.all([
    getStorefront(),
    productService.list({ limit: 48, status: "published" }),
  ]);
  return (
    <StorefrontEditor
      storefront={storefront}
      catalog={catalog.products.map((item) => ({ sku: item.sku, title: item.title }))}
    />
  );
}
