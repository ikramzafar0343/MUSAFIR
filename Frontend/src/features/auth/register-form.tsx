"use client";

import Link from "next/link";
import { useActionState } from "react";

import { brandName } from "@/constants/brand";
import { registerAction } from "@/features/auth/actions";
import { PasswordField } from "@/features/auth/password-field";

type State = { error?: string | undefined };

export function RegisterForm() {
  const [state, action] = useActionState(async (_prev: State, formData: FormData) => {
    return registerAction(formData);
  }, {});

  return (
    <div className="auth-form-panel">
      <div className="auth-form-header">
        <span className="auth-form-eyebrow">Join {brandName}</span>
        <h2 className="auth-form-title">Create Account</h2>
        <p className="auth-form-subtitle">Save favorites, track orders, and keep your wishlist simple</p>
      </div>
      <form className="auth-form" action={action}>
        <label className="auth-field">
          <span className="sr-only">Name</span>
          <input name="name" placeholder="Full Name" autoComplete="name" required className="auth-input" />
        </label>
        <label className="auth-field">
          <span className="sr-only">Email Address</span>
          <input type="email" name="email" placeholder="Email Address" autoComplete="email" required className="auth-input" />
        </label>
        <PasswordField name="password" label="Password" placeholder="Password" autoComplete="new-password" />
        <PasswordField
          name="confirmPassword"
          label="Confirm password"
          placeholder="Confirm Password"
          autoComplete="new-password"
        />
        {state.error ? <p className="auth-form-error">{state.error}</p> : null}
        <button type="submit" className="auth-btn auth-btn-primary luxury-button-solid">
          Create Account
        </button>
      </form>
      <p className="auth-form-meta">
        <span>Already a member?</span>
        <Link href="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
