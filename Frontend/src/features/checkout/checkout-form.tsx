"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { checkoutAction, type CheckoutActionState } from "@/features/checkout/actions";

type AddressOption = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  is_default: boolean;
};

type State = CheckoutActionState;

function PlaceOrderButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="luxury-button-solid checkout-submit" disabled={pending} aria-disabled={pending}>
      {pending ? "Placing order..." : "Place cash-on-delivery order"}
    </button>
  );
}

function Field({
  label,
  name,
  error,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  const errorId = `${name}-error`;
  return (
    <label className={className ?? "checkout-field"} htmlFor={name}>
      <span className="checkout-label">{label}</span>
      {children}
      {error ? (
        <span id={errorId} className="checkout-field-error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function CheckoutForm({
  defaultName,
  defaultEmail,
  addresses = [],
}: {
  defaultName?: string | undefined;
  defaultEmail?: string | undefined;
  addresses?: AddressOption[];
}) {
  const [state, action] = useActionState(async (_prev: State, formData: FormData) => {
    return checkoutAction(formData);
  }, {});
  const selected = addresses.find((item) => item.is_default) ?? addresses[0];
  const fields = state.fields ?? {};
  const values = state.values;

  return (
    <form
      id="checkout-form"
      key={state.error ? `checkout-error-${state.error}` : "checkout"}
      action={action}
      className="checkout-form"
      noValidate
    >
      {addresses.length > 0 ? (
        <section className="checkout-section">
          <h2 className="checkout-section-title">Saved address</h2>
          <Field label="Deliver to" name="savedAddress">
            <select
              id="savedAddress"
              name="savedAddress"
              defaultValue={selected?.id ?? ""}
              className="checkout-input"
              onChange={(event) => {
                const next = addresses.find((item) => item.id === event.target.value);
                const form = event.currentTarget.form;
                if (!next || !form) {
                  return;
                }
                const names = ["fullName", "phone", "address", "city", "postalCode"] as const;
                const values = [next.full_name, next.phone, next.address, next.city, next.postal_code];
                names.forEach((fieldName, index) => {
                  const field = form.elements.namedItem(fieldName);
                  if (field instanceof HTMLInputElement) {
                    field.value = values[index] ?? "";
                  }
                });
              }}
            >
              {addresses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                  {item.is_default ? " (default)" : ""}
                </option>
              ))}
            </select>
          </Field>
        </section>
      ) : null}

      <section className="checkout-section">
        <h2 className="checkout-section-title">Contact</h2>
        <div className="checkout-fields">
          <Field label="Full name" name="fullName" error={fields.fullName} className="checkout-field checkout-field--full">
            <input
              id="fullName"
              name="fullName"
              defaultValue={values?.fullName ?? selected?.full_name ?? defaultName ?? ""}
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              placeholder="e.g. Ahmed Khan"
              className="checkout-input"
              aria-invalid={Boolean(fields.fullName)}
              aria-describedby={fields.fullName ? "fullName-error" : undefined}
            />
          </Field>
          <Field label="Email" name="email" error={fields.email}>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={values?.email ?? defaultEmail ?? ""}
              required
              maxLength={254}
              autoComplete="email"
              inputMode="email"
              placeholder="you@email.com"
              className="checkout-input"
              aria-invalid={Boolean(fields.email)}
              aria-describedby={fields.email ? "email-error" : undefined}
            />
          </Field>
          <Field label="Phone" name="phone" error={fields.phone}>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={values?.phone ?? selected?.phone ?? ""}
              required
              minLength={7}
              maxLength={24}
              autoComplete="tel"
              inputMode="tel"
              placeholder="03xx xxxxxxx"
              className="checkout-input"
              aria-invalid={Boolean(fields.phone)}
              aria-describedby={fields.phone ? "phone-error" : undefined}
            />
          </Field>
        </div>
      </section>

      <section className="checkout-section">
        <h2 className="checkout-section-title">Delivery</h2>
        <div className="checkout-fields">
          <Field label="Street address" name="address" error={fields.address} className="checkout-field checkout-field--full">
            <input
              id="address"
              name="address"
              defaultValue={values?.address ?? selected?.address ?? ""}
              required
              minLength={8}
              maxLength={300}
              autoComplete="street-address"
              placeholder="House 12, Street 5, Gulberg III"
              className="checkout-input"
              aria-invalid={Boolean(fields.address)}
              aria-describedby={fields.address ? "address-error" : undefined}
            />
          </Field>
          <Field label="City" name="city" error={fields.city}>
            <input
              id="city"
              name="city"
              defaultValue={values?.city ?? selected?.city ?? ""}
              required
              minLength={2}
              maxLength={80}
              autoComplete="address-level2"
              placeholder="Lahore"
              className="checkout-input"
              aria-invalid={Boolean(fields.city)}
              aria-describedby={fields.city ? "city-error" : undefined}
            />
          </Field>
          <Field label="Postal code" name="postalCode" error={fields.postalCode}>
            <input
              id="postalCode"
              name="postalCode"
              defaultValue={values?.postalCode ?? selected?.postal_code ?? ""}
              required
              minLength={3}
              maxLength={12}
              autoComplete="postal-code"
              inputMode="numeric"
              placeholder="54000"
              className="checkout-input"
              aria-invalid={Boolean(fields.postalCode)}
              aria-describedby={fields.postalCode ? "postalCode-error" : undefined}
            />
          </Field>
        </div>
      </section>

      <section className="checkout-section">
        <h2 className="checkout-section-title">Payment</h2>
        <Field label="Promo code" name="promoCode" error={fields.promoCode}>
          <input
            id="promoCode"
            name="promoCode"
            defaultValue={values?.promoCode ?? ""}
            maxLength={40}
            autoComplete="off"
            spellCheck={false}
            placeholder="Optional"
            className="checkout-input"
            aria-invalid={Boolean(fields.promoCode)}
            aria-describedby={fields.promoCode ? "promoCode-error" : undefined}
          />
        </Field>
        <label className="checkout-payment-option mt-4">
          <input type="radio" name="paymentMethod" value="cod" defaultChecked />
          <span>Cash on delivery — pay the courier when your order arrives. No card is charged online.</span>
        </label>
        {/* Online / JazzCash / Easypaisa remain behind Phase 5 flags — see docs/payments-gateway.md */}
        {state.error ? (
          <p className="auth-form-error mt-3" role="alert">
            {state.error}
          </p>
        ) : null}
        <PlaceOrderButton />
      </section>
      <div className="checkout-honeypot" aria-hidden="true">
        <label htmlFor="hp_url">Leave blank</label>
        <input id="hp_url" name="hp_url" type="text" tabIndex={-1} autoComplete="off" />
      </div>
    </form>
  );
}
