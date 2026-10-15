import type { Role } from "@/constants/roles";
import { apiRequest } from "@/lib/api/client";

export type AuthUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly avatarUrl: string | null;
};

export const authApi = {
  me: async () => apiRequest<{ user: AuthUser }>("GET", "/auth/me"),
  login: async (input: { email: string; password: string }) =>
    apiRequest<{ user: AuthUser }>("POST", "/auth/login", input),
  register: async (input: { name: string; email: string; password: string; confirmPassword: string }) =>
    apiRequest<{ user: AuthUser }>("POST", "/auth/register", input),
  logout: async () => apiRequest<{ ok: boolean }>("POST", "/auth/logout", {}),
  forgot: async (input: { email: string }) =>
    apiRequest<{ resetPath?: string | undefined }>("POST", "/auth/forgot", input),
  reset: async (input: { token: string; password: string; confirmPassword: string }) =>
    apiRequest<{ ok: boolean }>("POST", "/auth/reset", input),
  adminLogin: async (input: { email: string; password: string }) =>
    apiRequest<{ challengeId: string }>("POST", "/auth/admin/login", input),
  adminVerify: async (input: { challengeId: string; otp: string }) =>
    apiRequest<{ user: AuthUser }>("POST", "/auth/admin/verify", input),
  updateProfile: async (input: { name: string; email: string }) =>
    apiRequest<{ user: AuthUser }>("PATCH", "/account/profile", input),
  changePassword: async (input: { currentPassword: string; password: string; confirmPassword: string }) =>
    apiRequest<{ ok: boolean }>("PATCH", "/account/password", input),
};

export const authService = authApi;
