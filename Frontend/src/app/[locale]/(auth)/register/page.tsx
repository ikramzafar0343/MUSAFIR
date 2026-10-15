import { redirect } from "next/navigation";

import { AUTH_BANNERS } from "@/constants/site";
import { AuthPageFrame } from "@/features/auth/auth-page-frame";
import { RegisterForm } from "@/features/auth/register-form";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/account");
  }
  const storefront = await getStorefront();
  return (
    <AuthPageFrame image={storefront.content.authRegisterSrc} imageAlt={AUTH_BANNERS.register.alt}>
      <RegisterForm />
    </AuthPageFrame>
  );
}
