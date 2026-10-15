import { redirect } from "next/navigation";

import { AUTH_BANNERS } from "@/constants/site";
import { AuthPageFrame } from "@/features/auth/auth-page-frame";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/account");
  }
  const storefront = await getStorefront();
  return (
    <AuthPageFrame image={storefront.content.authLoginSrc} imageAlt={AUTH_BANNERS.login.alt}>
      <ForgotPasswordForm />
    </AuthPageFrame>
  );
}
