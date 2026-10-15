import { redirect } from "next/navigation";

import { AUTH_BANNERS } from "@/constants/site";
import { AuthPageFrame } from "@/features/auth/auth-page-frame";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect("/account");
  }
  const { token } = await searchParams;
  const storefront = await getStorefront();
  return (
    <AuthPageFrame image={storefront.content.authLoginSrc} imageAlt={AUTH_BANNERS.login.alt}>
      <ResetPasswordForm token={token ?? ""} />
    </AuthPageFrame>
  );
}
