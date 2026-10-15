import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hmacSha256Hex(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function createNonce(): string {
  return randomBytes(16).toString("hex");
}

export function hmacSign(params: {
  readonly method: string;
  readonly path: string;
  readonly timestamp: string;
  readonly nonce: string;
  readonly bodyHash: string;
  readonly secret: string;
}): string {
  const canonical = `${params.method.toUpperCase()}\n${params.path}\n${params.timestamp}\n${params.nonce}\n${params.bodyHash}`;
  return createHmac("sha256", params.secret).update(canonical, "utf8").digest("hex");
}

export function timingSafeHexEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
