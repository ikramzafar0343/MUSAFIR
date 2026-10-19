import { redirect } from "next/navigation";

/** Customer registration disabled — checkout is guest-only. */
export default function RegisterPage() {
  redirect("/");
}
