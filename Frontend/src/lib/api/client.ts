import { cookies, headers } from "next/headers";

import { AppError } from "@/lib/app-error";
import { createNonce, hmacSign, sha256Hex } from "@/lib/crypto";
import { getEnv } from "@/lib/env";
import { type ApiErrorBody, type ApiSuccessBody,ERROR_CODES } from "@/types/api";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function cookieHeader(store: Awaited<ReturnType<typeof cookies>>): string {
  return store
    .getAll()
    .map((item) => {
      // Values are already decoded by Next; only encode when Cookie-header unsafe chars appear.
      const safe = /^[\w!#$%&'.*+\-^`|~]+$/.test(item.value) ? item.value : encodeURIComponent(item.value);
      return `${item.name}=${safe}`;
    })
    .join("; ");
}

function applySetCookie(store: Awaited<ReturnType<typeof cookies>>, line: string): void {
  const [pair, ...attrs] = line.split(";");
  if (!pair) {
    return;
  }
  const eq = pair.indexOf("=");
  if (eq < 1) {
    return;
  }
  const name = pair.slice(0, eq).trim();
  const value = decodeURIComponent(pair.slice(eq + 1).trim());
  const flags = Object.fromEntries(
    attrs.map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key?.toLowerCase() ?? "", rest.join("=")];
    }),
  );
  const maxAge = flags["max-age"] ? Number(flags["max-age"]) : undefined;
  store.set(name, value, {
    httpOnly: true,
    path: flags.path || "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    ...(maxAge !== undefined && Number.isFinite(maxAge) ? { maxAge } : {}),
  });
}

export async function apiRequest<T>(
  method: Method,
  route: string,
  body?: unknown,
  extraHeaders: Record<string, string> = {},
  options?: { timeoutMs?: number },
): Promise<T> {
  const env = getEnv();
  const queryIndex = route.indexOf("?");
  const routePath = queryIndex >= 0 ? route.slice(0, queryIndex) : route;
  const query = queryIndex >= 0 ? route.slice(queryIndex) : "";
  const pathname = `${env.API_PREFIX}${routePath}`;
  const rawBody = body === undefined || method === "GET" ? "" : JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = createNonce();
  const signature = hmacSign({
    method,
    path: pathname,
    timestamp,
    nonce,
    bodyHash: sha256Hex(rawBody),
    secret: env.HMAC_SIGNING_SECRET,
  });
  const store = await cookies();
  const incoming = await headers();
  const forwarded = incoming.get("x-forwarded-for")?.split(",")[0]?.trim() || incoming.get("x-real-ip")?.trim();
  const requestHeaders: Record<string, string> = {
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
    "X-Signature": signature,
    Origin: env.APP_URL,
    ...extraHeaders,
  };
  if (forwarded) {
    requestHeaders["X-Forwarded-For"] = forwarded;
  }
  const cookie = cookieHeader(store);
  if (cookie) {
    requestHeaders.Cookie = cookie;
  }
  if (rawBody) {
    requestHeaders["Content-Type"] = "application/json";
  }
  const timeoutMs = options?.timeoutMs ?? 8000;
  let response: Response;
  try {
    response = await fetch(`${env.API_URL}${pathname}${query}`, {
      method,
      headers: requestHeaders,
      ...(rawBody ? { body: rawBody } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new AppError("Request timed out. Please try again.", 504, ERROR_CODES.INTERNAL);
    }
    throw error;
  }
  const setCookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  for (const line of setCookies) {
    applySetCookie(store, line);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const payload = (await response.json()) as ApiSuccessBody<T> | ApiErrorBody;
  if (!response.ok || "error" in payload) {
    const error = "error" in payload ? payload.error : { code: ERROR_CODES.INTERNAL, message: "Request failed" };
    throw new AppError(error.message, response.status, error.code, error.fields ?? []);
  }
  return payload.data;
}

export function toQuery(values: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === "") {
      continue;
    }
    params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}
