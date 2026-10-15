"use client";

import { useActionState } from "react";

import { changePasswordAction, updateProfileAction } from "@/features/account/actions";
import { PasswordField } from "@/features/auth/password-field";

type State = { error?: string; ok?: boolean };

export function ProfileForms({ name, email }: { name: string; email: string }) {
  const [profile, profileAction] = useActionState(async (_prev: State, formData: FormData) => {
    return updateProfileAction(formData);
  }, {});
  const [password, passwordAction] = useActionState(async (_prev: State, formData: FormData) => {
    return changePasswordAction(formData);
  }, {});

  return (
    <div className="space-y-10">
      <form action={profileAction} className="checkout-form max-w-md space-y-4">
        <h2 className="text-sm tracking-[0.18em] uppercase">Login details</h2>
        <label className="auth-field">
          <span className="auth-field-label">Name</span>
          <input name="name" defaultValue={name} required className="auth-input" />
        </label>
        <label className="auth-field">
          <span className="auth-field-label">Login email</span>
          <input name="email" type="email" defaultValue={email} required className="auth-input" />
        </label>
        {profile.error ? <p className="auth-form-error">{profile.error}</p> : null}
        {profile.ok ? <p className="text-sm">Profile updated.</p> : null}
        <button type="submit" className="luxury-button-solid">
          Save login details
        </button>
      </form>
      <form action={passwordAction} className="checkout-form max-w-md space-y-4">
        <h2 className="text-sm tracking-[0.18em] uppercase">Change password</h2>
        <PasswordField
          name="currentPassword"
          label="Current password"
          placeholder="Current password"
          autoComplete="current-password"
          visibleLabel
        />
        <PasswordField
          name="password"
          label="New password"
          placeholder="New password"
          autoComplete="new-password"
          visibleLabel
        />
        <PasswordField
          name="confirmPassword"
          label="Confirm new password"
          placeholder="Confirm new password"
          autoComplete="new-password"
          visibleLabel
        />
        {password.error ? <p className="auth-form-error">{password.error}</p> : null}
        {password.ok ? <p className="text-sm">Password updated.</p> : null}
        <button type="submit" className="luxury-button-solid">
          Change password
        </button>
      </form>
    </div>
  );
}
