import { redirect } from "next/navigation";

/** Customer login disabled — checkout is guest-only. Staff use /admin/login. */
export default function LoginPage() {
  redirect("/");
}
