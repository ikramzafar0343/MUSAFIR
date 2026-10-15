export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  CUSTOMER: "CUSTOMER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_ROLES: readonly Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.STAFF,
];

export const PERMISSIONS = {
  MANAGE_USERS: [ROLES.SUPER_ADMIN],
  MANAGE_PRODUCTS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  MANAGE_INVENTORY: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER],
  MANAGE_ORDERS: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  VIEW_ANALYTICS: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER],
  MANAGE_CMS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role | string, permission: Permission): boolean {
  const allowed = PERMISSIONS[permission] as readonly string[];
  return allowed.includes(role);
}

export function hasAnyPermission(role: Role | string, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}
