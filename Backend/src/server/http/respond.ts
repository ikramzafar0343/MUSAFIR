import type { IncomingMessage, ServerResponse } from "node:http";

import { AppError } from "@/lib/app-error";
import { logger } from "@/lib/logger";
import { type ApiErrorBody, type ApiSuccessBody,ERROR_CODES } from "@/types/api";

export const MAX_JSON_BYTES = 8_000_000;
/** Base64 + JSON wrapper for the largest allowed upload (see UPLOAD_MAX_FILE_SIZE). */
export const MAX_UPLOAD_JSON_BYTES = 64_000_000;

export type RequestContext = {
  req: IncomingMessage;
  res: ServerResponse;
  method: string;
  path: string;
  url: URL;
  headers: IncomingHttpHeaders;
  rawBody: string;
  body: unknown;
  params: Record<string, string>;
  query: Record<string, string>;
  ip: string;
  correlationId: string;
  sessionToken?: string | undefined;
};

type IncomingHttpHeaders = IncomingMessage["headers"];

export function header(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.split("=");
    if (!rawKey) {
      continue;
    }
    out[rawKey.trim()] = decodeURIComponent(rest.join("=").trim());
  }
  return out;
}

export async function readBody(req: IncomingMessage, maxBytes = MAX_JSON_BYTES): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) {
      throw AppError.payloadTooLarge();
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function sendJson(res: ServerResponse, status: number, body: unknown, extraHeaders: Record<string, string> = {}): void {
  const payload = JSON.stringify(body);
  if (Buffer.byteLength(payload, "utf8") > MAX_JSON_BYTES) {
    sendError(res, AppError.payloadTooLarge());
    return;
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  for (const [key, value] of Object.entries(extraHeaders)) {
    res.setHeader(key, value);
  }
  res.writeHead(status);
  res.end(payload);
}

export function sendSuccess<T>(
  res: ServerResponse,
  data: T,
  status = 200,
  extraHeaders: Record<string, string> = {},
): void {
  const body: ApiSuccessBody<T> = { data };
  sendJson(res, status, body, extraHeaders);
}

export function sendError(res: ServerResponse, error: unknown, correlationId?: string): void {
  if (error instanceof AppError) {
    const payload: ApiErrorBody = {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields.length ? { fields: error.fields } : {}),
      },
    };
    const extra: Record<string, string> = {};
    if (error.statusCode === 429) {
      extra["Retry-After"] = String(error.retryAfterSeconds ?? 60);
    }
    sendJson(res, error.statusCode, payload, extra);
    return;
  }

  logger.error({ err: error, correlationId }, "Unhandled API error");
  const payload: ApiErrorBody = {
    error: {
      code: ERROR_CODES.INTERNAL,
      message: "Internal server error",
    },
  };
  sendJson(res, 500, payload);
}

export function setCookie(res: ServerResponse, name: string, value: string, maxAgeSeconds: number): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${name}=${encodeURIComponent(value)}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Strict${secure}`,
  );
}

export function clearCookie(res: ServerResponse, name: string): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${name}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${secure}`);
}
