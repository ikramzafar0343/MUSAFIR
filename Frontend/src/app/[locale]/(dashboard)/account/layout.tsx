import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/** Customer account area disabled — checkout is guest-only. */
export default function AccountLayout({ children: _children }: { children: ReactNode }) {
  redirect("/");
}
