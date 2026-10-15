import { configuredPaymentProvider, isOnlinePaymentsEnabled } from "@/constants/payments";
import { AppError } from "@/lib/app-error";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";

/**
 * Payment provider webhook endpoint (Phase 5 scaffold).
 * Rejects until ONLINE_PAYMENTS_ENABLED=true and a provider is wired.
 * COD checkout remains available via POST /orders regardless.
 */
export const definition: RouteDefinition = {
  method: "POST",
  path: "/payments/webhook",
};

export async function handler(_ctx: RequestContext) {
  if (!isOnlinePaymentsEnabled() || configuredPaymentProvider() === "none") {
    throw AppError.unprocessable(
      "Online payments are disabled. Cash on delivery remains available at checkout.",
    );
  }
  // Provider-specific signature verify + idempotent reconciliation lands in Phase 5.
  throw AppError.unprocessable("Payment provider webhook is not configured yet.");
}
