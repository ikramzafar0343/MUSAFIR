"use client";

import { IconSignOut } from "@/features/admin/admin-nav-icons";
import { logoutAction } from "@/features/auth/actions";

export function AdminHeader() {
  return (
    <header className="admin-topbar">
      <form action={logoutAction}>
        <button type="submit" className="admin-signout">
          <IconSignOut />
          Sign out
        </button>
      </form>
    </header>
  );
}
