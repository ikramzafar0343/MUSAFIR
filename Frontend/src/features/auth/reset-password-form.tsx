"use client";

import Link from "next/link";
import { useActionState } from "react";

import { resetPasswordAction } from "@/features/auth/actions";
import { PasswordField } from "@/features/auth/password-field";

type State = { error?: string | undefined };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(async (_prev: State, formData: FormData) => {
    return resetPasswordAction(formData);
  }, {});

  if (!token) {
    return (
      <div className="auth-form-panel">
        <div className="auth-form-header">
          <span className="auth-form-eyebrow">Member Access</span>
          <h2 className="auth-form-title">Link Missing</h2>
          <p className="auth-form-subtitle">This reset page needs a valid link from your email.</p>
        </div>
        <Link href="/forgot-password" className="auth-btn auth-btn-primary luxury-button-solid">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-form-panel">
      <div className="auth-form-header">
        <span className="auth-form-eyebrow">Member Access</span>
        <h2 className="auth-form-title">New Password</h2>
        <p className="auth-form-subtitle">Choose a password of at least 8 characters.</p>
      </div>
      <form className="auth-form" action={action}>
        <input type="hidden" name="token" value={token} />
        <PasswordField
          name="password"
          label="New password"
          placeholder="New password"
          autoComplete="new-password"
          minLength={8}
        />
        <PasswordField
          name="confirmPassword"
          label="Confirm password"
          placeholder="Confirm password"
          autoComplete="new-password"
          minLength={8}
        />
        {state.error ? <p className="auth-form-error">{state.error}</p> : null}
        <button type="submit" className="auth-btn auth-btn-primary luxury-button-solid">
          Update password
        </button>
      </form>
    </div>
  );
}
