import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ROLES } from "@/constants/roles";
import { AppError } from "@/lib/app-error";
import {
  hasPermission,
  requireAdmin,
  requireAnyPermission,
  requirePermission,
  requireSession,
} from "@/server/middleware/authorize";

const staff = { id: "1", role: ROLES.STAFF, email: "s@x.com", name: "Staff", avatarUrl: null };
const admin = { id: "2", role: ROLES.ADMIN, email: "a@x.com", name: "Admin", avatarUrl: null };
const customer = { id: "3", role: ROLES.CUSTOMER, email: "c@x.com", name: "Cust", avatarUrl: null };
const manager = { id: "4", role: ROLES.MANAGER, email: "m@x.com", name: "Mgr", avatarUrl: null };

describe("authorize", () => {
  it("requireSession rejects null", () => {
    assert.throws(() => requireSession(null), (error: unknown) => error instanceof AppError && error.statusCode === 401);
  });

  it("requireAdmin allows staff and rejects customer", () => {
    assert.equal(requireAdmin(staff).id, "1");
    assert.throws(() => requireAdmin(customer), (error: unknown) => error instanceof AppError && error.statusCode === 403);
  });

  it("STAFF cannot manage products; ADMIN can", () => {
    assert.equal(hasPermission(ROLES.STAFF, "MANAGE_PRODUCTS"), false);
    assert.equal(hasPermission(ROLES.ADMIN, "MANAGE_PRODUCTS"), true);
    assert.throws(
      () => requirePermission(staff, "MANAGE_PRODUCTS"),
      (error: unknown) => error instanceof AppError && error.statusCode === 403,
    );
    assert.equal(requirePermission(admin, "MANAGE_PRODUCTS").id, "2");
  });

  it("STAFF can manage orders; MANAGER can manage inventory", () => {
    assert.equal(requirePermission(staff, "MANAGE_ORDERS").id, "1");
    assert.equal(requirePermission(manager, "MANAGE_INVENTORY").id, "4");
    assert.throws(
      () => requirePermission(staff, "MANAGE_INVENTORY"),
      (error: unknown) => error instanceof AppError && error.statusCode === 403,
    );
  });

  it("requireAnyPermission accepts either permission", () => {
    assert.equal(requireAnyPermission(manager, ["MANAGE_PRODUCTS", "MANAGE_INVENTORY"]).id, "4");
    assert.throws(
      () => requireAnyPermission(staff, ["MANAGE_PRODUCTS", "MANAGE_CMS"]),
      (error: unknown) => error instanceof AppError && error.statusCode === 403,
    );
  });
});
