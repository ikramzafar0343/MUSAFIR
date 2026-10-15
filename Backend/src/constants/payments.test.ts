import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { configuredPaymentProvider, isOnlinePaymentsEnabled } from "@/constants/payments";

describe("payment flags", () => {
  it("defaults online payments to disabled", () => {
    const previous = process.env.ONLINE_PAYMENTS_ENABLED;
    delete process.env.ONLINE_PAYMENTS_ENABLED;
    assert.equal(isOnlinePaymentsEnabled(), false);
    if (previous !== undefined) process.env.ONLINE_PAYMENTS_ENABLED = previous;
  });

  it("defaults provider to none", () => {
    const previous = process.env.PAYMENT_PROVIDER;
    delete process.env.PAYMENT_PROVIDER;
    assert.equal(configuredPaymentProvider(), "none");
    if (previous !== undefined) process.env.PAYMENT_PROVIDER = previous;
  });
});
