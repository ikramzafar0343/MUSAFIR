import { cookies } from "next/headers";
import { cache } from "react";

import { sessionCookieName } from "@/constants/cookies";
import { authApi, type AuthUser } from "@/lib/api/auth";
import { AppError } from "@/lib/app-error";

export type { AuthUser };

export const getSessionUser = cache(async (): Promise<AuthUser | null> => {
  const store = await cookies();
  if (!store.get(sessionCookieName)?.value) {
    return null;
  }
  try {
    const result = await authApi.me();
    return result.user;
  } catch (error) {
    if (error instanceof AppError && (error.statusCode === 401 || error.statusCode === 403)) {
      return null;
    }
    throw error;
  }
});
