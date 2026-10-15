import { redirect } from "next/navigation";

import { ProfileForms } from "@/features/account/profile-forms";
import { logoutAction } from "@/features/auth/actions";
import { getSessionUser } from "@/lib/session";

export default async function AccountSettingsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <>
      <h1 className="customer-dashboard-title mb-6">Settings</h1>
      <ProfileForms name={user.name} email={user.email} />
      <form action={logoutAction} className="mt-8">
        <button type="submit" className="luxury-button-outline">
          Sign out
        </button>
      </form>
    </>
  );
}
