import { getEnv } from "@/lib/env";
import { consumeRateLimitTokenWith } from "@/server/auth/rate-limit";

export async function applyRateLimit(identity: string, kind: "signed" | "unsigned" = "signed"): Promise<void> {
  const env = getEnv();
  if (kind === "unsigned") {
    await consumeRateLimitTokenWith(identity, Math.min(env.RATE_LIMIT_CAPACITY, 40), env.RATE_LIMIT_REFILL_PER_SECOND);
    return;
  }
  await consumeRateLimitTokenWith(
    identity,
    Math.max(env.RATE_LIMIT_CAPACITY, 400),
    Math.max(env.RATE_LIMIT_REFILL_PER_SECOND, 2),
  );
}

export function clientIp(remoteAddress: string | undefined, forwardedFor: string | undefined): string {
  const remote = normalizeIp(remoteAddress ?? "unknown");
  const forwarded = forwardedFor?.split(",")[0]?.trim();
  if (forwarded && isTrustedProxy(remote)) {
    return normalizeIp(forwarded);
  }
  return remote;
}

function normalizeIp(value: string): string {
  return value.replace(/^::ffff:/, "") || "unknown";
}

function isTrustedProxy(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}
