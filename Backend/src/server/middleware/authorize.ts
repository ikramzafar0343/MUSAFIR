import {
  ADMIN_ROLES,
  type Permission,
  PERMISSIONS,
  type Role,
} from "@/constants/roles";
import { AppError } from "@/lib/app-error";
import type { AuthUser } from "@/server/services/auth/auth.service";

export function hasPermission(role: Role | string, permission: Permission): boolean {
  const allowed = PERMISSIONS[permission] as readonly string[];
  return allowed.includes(role);
}

export function requireSession(user: AuthUser | null): AuthUser {
  if (!user) {
    throw AppError.unauthenticated();
  }
  return user;
}

export function requireAdmin(user: AuthUser | null): AuthUser {
  const session = requireSession(user);
  if (!ADMIN_ROLES.includes(session.role as Role)) {
    throw AppError.unauthorized();
  }
  return session;
}

/** Enforce a single RBAC permission. STAFF ≠ SUPER_ADMIN. */
export function requirePermission(user: AuthUser | null, permission: Permission): AuthUser {
  const session = requireAdmin(user);
  if (!hasPermission(session.role, permission)) {
    throw AppError.unauthorized(`Missing permission: ${permission}`);
  }
  return session;
}

/** Enforce that the user holds at least one of the listed permissions. */
export function requireAnyPermission(user: AuthUser | null, permissions: readonly Permission[]): AuthUser {
  const session = requireAdmin(user);
  if (!permissions.some((permission) => hasPermission(session.role, permission))) {
    throw AppError.unauthorized(`Missing permission: ${permissions.join(" | ")}`);
  }
  return session;
}
