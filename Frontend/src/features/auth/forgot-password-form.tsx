"use client";

import Link from "next/link";
import { useActionState } from "react";

import { forgotPasswordAction } from "@/features/auth/actions";

type State = { error?: string | undefined; ok?: boolean | undefined; resetPath?: string | undefined };

export function ForgotPasswordForm() {
  const [state, action] = useActionState(async (_prev: State, formData: FormData) => {
    return forgotPasswordAction(formData);
  }, {});

  return (
    <div className="auth-form-panel">
      <div className="auth-form-header">
        <span className="auth-form-eyebrow">Member Access</span>
        <h2 className="auth-form-title">Reset Password</h2>
        <p className="auth-form-subtitle">Enter the email on your account and we will send a reset link.</p>
      </div>
      <form className="auth-form" action={action}>
        <label className="auth-field">
          <span className="sr-only">Email Address</span>
          <input type="email" name="email" placeholder="Email Address" autoComplete="email" required className="auth-input" />
        </label>
        {state.error ? <p className="auth-form-error">{state.error}</p> : null}
        {state.ok ? (
          <p className="contact-form-ok">If that email is registered, a reset link is on its way.</p>
        ) : null}
        {state.resetPath ? (
          <p className="contact-form-ok">
            Mail is not configured here. Use{" "}
            <Link href={state.resetPath} className="auth-link">
              this reset link
            </Link>
            .
          </p>
        ) : null}
        <button type="submit" className="auth-btn auth-btn-primary luxury-button-solid">
          Send reset link
        </button>
      </form>
      <p className="auth-form-meta">
        <span>Remembered it?</span>
        <Link href="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
