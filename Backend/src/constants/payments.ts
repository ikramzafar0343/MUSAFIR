/**
 * Payment gateway feature flags (Phase 5).
 * COD remains the only live method until ONLINE_PAYMENTS_ENABLED is true
 * and a provider is configured.
 */
export const PAYMENT_PROVIDERS = {
  NONE: "none",
  STRIPE: "stripe",
  JAZZCASH: "jazzcash",
  EASYPAISA: "easypaisa",
} as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

export function isOnlinePaymentsEnabled(): boolean {
  return String(process.env.ONLINE_PAYMENTS_ENABLED ?? "false").toLowerCase() === "true";
}

export function configuredPaymentProvider(): PaymentProvider {
  const raw = String(process.env.PAYMENT_PROVIDER ?? PAYMENT_PROVIDERS.NONE).toLowerCase();
  if (raw === PAYMENT_PROVIDERS.STRIPE) return PAYMENT_PROVIDERS.STRIPE;
  if (raw === PAYMENT_PROVIDERS.JAZZCASH) return PAYMENT_PROVIDERS.JAZZCASH;
  if (raw === PAYMENT_PROVIDERS.EASYPAISA) return PAYMENT_PROVIDERS.EASYPAISA;
  return PAYMENT_PROVIDERS.NONE;
}
