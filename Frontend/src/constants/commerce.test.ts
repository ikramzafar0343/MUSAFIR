import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateOrderTotals,
  calculateShippingFee,
  DEFAULT_COMMERCE_SETTINGS,
} from "@/constants/commerce";

describe("frontend commerce totals", () => {
  it("mirrors free-shipping threshold behavior", () => {
    const threshold = DEFAULT_COMMERCE_SETTINGS.freeShippingThreshold;
    assert.equal(calculateShippingFee(threshold - 1, DEFAULT_COMMERCE_SETTINGS), DEFAULT_COMMERCE_SETTINGS.standardShippingFee);
    assert.equal(calculateShippingFee(threshold, DEFAULT_COMMERCE_SETTINGS), 0);
  });

  it("keeps discounted totals non-negative", () => {
    const totals = calculateOrderTotals(500, DEFAULT_COMMERCE_SETTINGS, 800);
    assert.equal(totals.discount, 500);
    assert.ok(totals.total >= 0);
  });
});
