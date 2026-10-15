import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AccountNav } from "@/features/account/account-nav";
import { getSessionUser } from "@/lib/session";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <div className="customer-dashboard">
      <div className="customer-dashboard-shell">
        <AccountNav />
        <div className="customer-dashboard-main">{children}</div>
      </div>
    </div>
  );
}
