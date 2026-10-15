"use client";

import Link from "next/link";
import { useActionState } from "react";

import { brandName } from "@/constants/brand";
import { loginAction } from "@/features/auth/actions";
import { PasswordField } from "@/features/auth/password-field";

type State = { error?: string | undefined };

export function LoginForm() {
  const [state, action, pending] = useActionState(async (_prev: State, formData: FormData) => {
    return loginAction(formData);
  }, {});

  return (
    <div className="auth-form-panel">
      <div className="auth-form-header">
        <span className="auth-form-eyebrow">Member Access</span>
        <h2 className="auth-form-title">Welcome Back</h2>
        <p className="auth-form-subtitle">Access your orders, wishlist, and saved pieces</p>
      </div>
      <form className="auth-form" action={action}>
        <label className="auth-field">
          <span className="sr-only">Email Address</span>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            autoComplete="email"
            required
            className="auth-input"
            disabled={pending}
          />
        </label>
        <PasswordField name="password" label="Password" placeholder="Password" autoComplete="current-password" />
        <div className="auth-form-password-meta">
          <Link href="/forgot-password" className="auth-link">
            Forgot password?
          </Link>
        </div>
        {state.error ? (
          <p className="auth-form-error" role="alert">
            {state.error}
          </p>
        ) : null}
        <button type="submit" className="auth-btn auth-btn-primary luxury-button-solid" disabled={pending}>
          {pending ? "Signing in…" : "Sign In"}
        </button>
      </form>
      <div className="auth-form-foot">
        <Link href="/collections/all" className="auth-link">
          Continue as Guest
        </Link>
        <span className="auth-form-foot-copy">New to {brandName}?</span>
        <Link href="/register" className="auth-link auth-form-foot-end">
          Create an account
        </Link>
      </div>
    </div>
  );
}
