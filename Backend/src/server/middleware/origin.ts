import { AppError } from "@/lib/app-error";
import { corsOrigins } from "@/lib/env";

export function assertAllowedOrigin(origin: string | undefined, referer: string | undefined, mutating: boolean): void {
  if (!mutating) {
    return;
  }
  const resolved = resolveOrigin(origin, referer);
  if (!resolved) {
    return;
  }
  if (!corsOrigins().includes(resolved)) {
    throw AppError.unauthorized("Origin not allowed");
  }
}

function resolveOrigin(origin: string | undefined, referer: string | undefined): string | undefined {
  if (origin) {
    return origin.replace(/\/$/, "");
  }
  if (!referer) {
    return undefined;
  }
  try {
    return new URL(referer).origin.replace(/\/$/, "");
  } catch {
    return undefined;
  }
}
