import { type NextRequest, NextResponse } from "next/server";

import { DEFAULT_LOCALE, LOCALES } from "@/constants/site";

function hasLocale(pathname: string): boolean {
  return LOCALES.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/fonts") ||
    pathname.includes(".")
  ) {
    const passthrough = NextResponse.next({ request: { headers: requestHeaders } });
    passthrough.headers.set("Content-Security-Policy", csp);
    passthrough.headers.set("X-Content-Type-Options", "nosniff");
    passthrough.headers.set("X-Frame-Options", "DENY");
    passthrough.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    passthrough.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return passthrough;
  }

  if (!hasLocale(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      url.protocol = "http:";
    }
    const rewritten = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    rewritten.headers.set("Content-Security-Policy", csp);
    rewritten.headers.set("X-Content-Type-Options", "nosniff");
    rewritten.headers.set("X-Frame-Options", "DENY");
    rewritten.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    rewritten.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return rewritten;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
