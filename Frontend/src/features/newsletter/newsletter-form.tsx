"use client";

import { useActionState } from "react";

import { subscribeNewsletterAction } from "@/features/newsletter/actions";

type State = { error?: string; ok?: boolean };

export function NewsletterForm() {
  const [state, action] = useActionState(async (_prev: State, formData: FormData) => {
    return subscribeNewsletterAction(formData);
  }, {});

  return (
    <form action={action} className="footer-newsletter-form flex flex-col" noValidate>
      <label className="sr-only" htmlFor="newsletter-email">
        Email
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="Email address"
        className="footer-newsletter-input"
      />
      <button type="submit" className="footer-newsletter-btn">
        Subscribe
      </button>
      {state.error ? (
        <p role="alert" className="footer-newsletter-message">
          {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="footer-newsletter-message">You are subscribed. Thank you!</p> : null}
    </form>
  );
}
