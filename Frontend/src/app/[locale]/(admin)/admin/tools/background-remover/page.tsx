import { redirect } from "next/navigation";

/** Background remover tool removed from admin UI. */
export default function AdminBackgroundRemoverPage() {
  redirect("/admin");
}
