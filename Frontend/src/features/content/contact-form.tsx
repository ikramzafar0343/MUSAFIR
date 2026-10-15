"use client";

import { useActionState } from "react";

import { contactAction } from "@/features/content/actions";

type State = { error?: string | undefined; ok?: boolean | undefined };

export function ContactForm() {
  const [state, action] = useActionState(async (_prev: State, formData: FormData) => {
    return contactAction(formData);
  }, {});

  return (
    <form action={action} className="contact-form">
      <label className="auth-field">
        <span className="sr-only">Name</span>
        <input name="name" required minLength={2} placeholder="Name" className="auth-input" />
      </label>
      <label className="auth-field">
        <span className="sr-only">Email</span>
        <input name="email" type="email" required placeholder="Email" className="auth-input" />
      </label>
      <label className="auth-field">
        <span className="sr-only">Message</span>
        <textarea name="message" required minLength={10} rows={5} placeholder="How can we help?" className="auth-input contact-form-message" />
      </label>
      {state.error ? <p className="auth-form-error">{state.error}</p> : null}
      {state.ok ? <p className="contact-form-ok">Thank you. We will reply within one business day.</p> : null}
      <button type="submit" className="luxury-button-solid">
        Send message
      </button>
    </form>
  );
}
