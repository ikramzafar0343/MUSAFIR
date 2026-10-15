import { redirect } from "next/navigation";

import { ADMIN_ROLES, hasPermission } from "@/constants/roles";
import { BackgroundRemoverPage } from "@/features/admin/background-remover/background-remover-page";
import { getSessionUser } from "@/lib/session";

export default async function AdminBackgroundRemoverPage() {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect("/admin/login");
  }
  if (!hasPermission(user.role, "MANAGE_PRODUCTS")) {
    redirect("/admin");
  }
  return <BackgroundRemoverPage />;
}
