import { redirect } from "next/navigation";

/** Customer password reset disabled — checkout is guest-only. */
export default function ForgotPasswordPage() {
  redirect("/");
}
