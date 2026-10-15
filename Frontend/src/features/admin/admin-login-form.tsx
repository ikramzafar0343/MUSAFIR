"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { adminLoginAction, adminVerifyAction } from "@/features/admin/actions";
import { AdminPasscodeModal } from "@/features/admin/admin-passcode-modal";
import { PasswordField } from "@/features/auth/password-field";

type LoginState = {
  error?: string | undefined;
  challengeId?: string | undefined;
};

export function AdminLoginForm({
  seedHint,
}: {
  seedHint?: { email: string; password: string; passcode: string } | undefined;
}) {
  const [challengeId, setChallengeId] = useState<string | undefined>();
  const [loginState, loginFormAction, loginPending] = useActionState(async (_prev: LoginState, formData: FormData) => {
    const result = await adminLoginAction(formData);
    if (result.challengeId) {
      setChallengeId(result.challengeId);
    }
    return result;
  }, {});
  const [verifyState, verifyFormAction] = useActionState(async (_prev: { error?: string }, formData: FormData) => {
    return adminVerifyAction(formData);
  }, {});

  function closePasscodeModal() {
    setChallengeId(undefined);
  }

  return (
    <>
      <div className="auth-form-panel">
        <div className="auth-form-header">
          <span className="auth-form-eyebrow">Admin Access</span>
          <h2 className="auth-form-title">Sign in</h2>
          <p className="auth-form-subtitle">Sign in to manage products, orders, and storefront content</p>
        </div>
        <form className="auth-form" action={loginFormAction}>
          <label className="auth-field">
            <span className="sr-only">Email</span>
            <input
              type="email"
              name="email"
              required
              className="auth-input"
              placeholder="Email Address"
              defaultValue={seedHint?.email}
              disabled={loginPending}
            />
          </label>
          <PasswordField name="password" label="Password" placeholder="Password" autoComplete="current-password" />
          <div className="auth-form-password-meta">
            <Link href="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>
          {loginState.error ? (
            <p className="auth-form-error" role="alert">
              {loginState.error}
            </p>
          ) : null}
          {seedHint ? (
            <p className="admin-login-seed">
              Local admin: {seedHint.email} / {seedHint.password} · passcode {seedHint.passcode}
            </p>
          ) : null}
          <button type="submit" className="auth-btn auth-btn-primary luxury-button-solid" disabled={loginPending}>
            {loginPending ? "Checking…" : "Continue"}
          </button>
        </form>
      </div>

      <AdminPasscodeModal
        open={Boolean(challengeId)}
        challengeId={challengeId ?? ""}
        error={verifyState.error}
        onClose={closePasscodeModal}
        onSubmit={verifyFormAction}
      />
    </>
  );
}
