import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ADMIN_ROLES } from "@/constants/roles";
import { AdminHeader } from "@/features/admin/admin-header";
import { AdminSidebar } from "@/features/admin/admin-sidebar";
import { getSessionUser } from "@/lib/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect("/admin/login");
  }
  return (
    <div className="admin-app">
      <AdminSidebar role={user.role} />
      <div className="admin-app-main">
        <AdminHeader />
        <div className="admin-app-body">{children}</div>
      </div>
    </div>
  );
}
