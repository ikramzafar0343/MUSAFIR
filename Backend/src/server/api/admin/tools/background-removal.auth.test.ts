import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ROLES } from "@/constants/roles";
import { AppError } from "@/lib/app-error";
import { requirePermission } from "@/server/middleware/authorize";

/**
 * Route POST /admin/tools/background-removal gates on MANAGE_PRODUCTS.
 * Full HMAC/session integration is covered elsewhere; this locks the permission contract.
 */
describe("background-removal route auth contract", () => {
  it("rejects unauthenticated callers", () => {
    assert.throws(
      () => requirePermission(null, "MANAGE_PRODUCTS"),
      (error: unknown) => error instanceof AppError && error.statusCode === 401,
    );
  });

  it("rejects STAFF (no MANAGE_PRODUCTS)", () => {
    assert.throws(
      () =>
        requirePermission(
          { id: "1", role: ROLES.STAFF, email: "s@x.com", name: "Staff", avatarUrl: null },
          "MANAGE_PRODUCTS",
        ),
      (error: unknown) => error instanceof AppError && error.statusCode === 403,
    );
  });

  it("allows ADMIN", () => {
    const user = requirePermission(
      { id: "2", role: ROLES.ADMIN, email: "a@x.com", name: "Admin", avatarUrl: null },
      "MANAGE_PRODUCTS",
    );
    assert.equal(user.id, "2");
  });
});
