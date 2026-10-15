/** Mirrors Backend feature flag — keep online UI disabled until Phase 5. */
export function isOnlinePaymentsEnabled(): boolean {
  return String(process.env.NEXT_PUBLIC_ONLINE_PAYMENTS_ENABLED ?? "false").toLowerCase() === "true";
}
