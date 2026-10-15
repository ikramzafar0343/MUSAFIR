import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";

import { sessionCookieName } from "@/constants/cookies";
import { AppError } from "@/lib/app-error";
import { corsOrigins, getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { verifyHmac } from "@/server/auth/hmac";
import { loadApiRoutes, type LoadedRoute, matchRoute } from "@/server/http/load-routes";
import {
  header,
  MAX_UPLOAD_JSON_BYTES,
  parseCookies,
  readBody,
  type RequestContext,
  sendError,
  sendJson,
} from "@/server/http/respond";
import { tryServeUpload } from "@/server/http/serve-upload";
import { assertAllowedOrigin } from "@/server/middleware/origin";
import { applyRateLimit, clientIp } from "@/server/middleware/rate-limit";

let routes: LoadedRoute[] | undefined;

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const env = getEnv();
  const correlationId = header(req.headers, "x-request-id") ?? randomUUID();
  res.setHeader("X-Request-Id", correlationId);

  const origin = header(req.headers, "origin");
  const allowed = corsOrigins();
  if (origin && allowed.includes(origin.replace(/\/$/, ""))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Timestamp, X-Nonce, X-Signature, Idempotency-Key");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const host = req.headers.host ?? `${env.API_HOST}:${env.API_PORT}`;
  const url = new URL(req.url ?? "/", `http://${host}`);

  // CMS media is stored on this process's UPLOAD_DIR — serve it before HMAC/JSON.
  if (await tryServeUpload(req, res, url.pathname)) {
    return;
  }

  const apiPath = url.pathname.startsWith(env.API_PREFIX)
    ? url.pathname.slice(env.API_PREFIX.length) || "/"
    : url.pathname;

  try {
    assertAllowedOrigin(origin, header(req.headers, "referer"), ["POST", "PUT", "PATCH", "DELETE"].includes(req.method ?? ""));

    /* Hero/storefront videos / BG remover are posted as base64 JSON and exceed the default 8MB JSON cap. */
    const uploadBody =
      apiPath === "/admin/uploads" ||
      apiPath === "/admin/uploads/" ||
      apiPath === "/admin/uploads/hero-video" ||
      apiPath === "/admin/uploads/hero-video/" ||
      apiPath === "/admin/tools/background-removal" ||
      apiPath === "/admin/tools/background-removal/" ||
      apiPath === "/shop/custom-logo" ||
      apiPath === "/shop/custom-logo/"
        ? MAX_UPLOAD_JSON_BYTES
        : undefined;
    const rawBody = await readBody(req, uploadBody);
    let body: unknown = {};
    if (rawBody.length > 0) {
      try {
        body = JSON.parse(rawBody) as unknown;
      } catch {
        throw AppError.validation([{ field: "body", message: "Invalid JSON" }]);
      }
    }

    const ip = clientIp(req.socket.remoteAddress, header(req.headers, "x-forwarded-for"));
    // Docker / reverse-proxy probes must not require HMAC.
    const isPublicHealth =
      (req.method ?? "GET") === "GET" &&
      (apiPath === "/health" || apiPath === "/health/");
    if (!isPublicHealth) {
      try {
        await verifyHmac({
          method: req.method ?? "GET",
          path: url.pathname,
          timestampHeader: header(req.headers, "x-timestamp"),
          nonceHeader: header(req.headers, "x-nonce"),
          signatureHeader: header(req.headers, "x-signature"),
          rawBody,
        });
      } catch (error) {
        await applyRateLimit(`unsigned:${ip}`, "unsigned");
        throw error;
      }
      await applyRateLimit(`signed:${ip}`, "signed");
    } else {
      await applyRateLimit(`health:${ip}`, "unsigned");
    }

    if (!routes) {
      routes = await loadApiRoutes(fileURLToPath(new URL("../api", import.meta.url)));
    }

    const matched = matchRoute(routes, req.method ?? "GET", apiPath);
    if (!matched) {
      throw AppError.notFound(`Route ${url.pathname} not found`);
    }

    const cookies = parseCookies(header(req.headers, "cookie"));
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const ctx: RequestContext = {
      req,
      res,
      method: req.method ?? "GET",
      path: apiPath,
      url,
      headers: req.headers,
      rawBody,
      body,
      params: matched.params,
      query,
      ip,
      correlationId,
      sessionToken: cookies[sessionCookieName],
    };

    const data = await matched.route.handler(ctx);
    const status = req.method === "POST" ? 201 : 200;
    if (data === undefined) {
      res.writeHead(204);
      res.end();
      return;
    }
    const extraHeaders: Record<string, string> = {};
    if (req.method === "GET" && matched.route.path === "/storefront") {
      extraHeaders["Cache-Control"] = "no-store, max-age=0";
    }
    sendJson(res, req.method === "POST" ? status : 200, { data }, extraHeaders);
  } catch (error) {
    const status = error instanceof AppError ? error.statusCode : 500;
    const payload = {
      err: error instanceof Error ? error.message : "error",
      correlationId,
      path: url.pathname,
      status,
      ...(error instanceof AppError && error.fields.length
        ? { fields: error.fields.map((field) => `${field.field}: ${field.message}`) }
        : {}),
    };
    if (status >= 500) {
      logger.error(payload, "API request failed");
    } else {
      logger.info(payload, "API request rejected");
    }
    sendError(res, error, correlationId);
  }
}
