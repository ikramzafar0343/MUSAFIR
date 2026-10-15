"use client";

import { useId, useState } from "react";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 3l18 18M10.6 10.7a2 2 0 002.8 2.8M9.9 5.2A10.5 10.5 0 0121 12a10.5 10.5 0 01-3.2 4.6M6.1 6.2A10.5 10.5 0 003 12a10.5 10.5 0 009 6.5c1.1 0 2.1-.2 3.1-.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function PasswordField({
  name,
  placeholder,
  autoComplete,
  required = true,
  minLength,
  label,
  visibleLabel = false,
}: {
  name: string;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  label: string;
  visibleLabel?: boolean;
}) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);
  return (
    <label className="auth-field" htmlFor={inputId}>
      <span className={visibleLabel ? "auth-field-label" : "sr-only"}>{label}</span>
      <span className="auth-password-field">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="auth-input auth-password-input"
        />
        <button
          type="button"
          className="auth-password-toggle"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          <EyeIcon open={visible} />
        </button>
      </span>
    </label>
  );
}
