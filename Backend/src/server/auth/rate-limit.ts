import { AppError } from "@/lib/app-error";
import { getEnv } from "@/lib/env";
import { rateLimitRepository } from "@/server/database/repositories/rate-limit/rate-limit.repository";

export async function consumeRateLimitToken(key: string): Promise<void> {
  const env = getEnv();
  await consumeRateLimitTokenWith(key, env.RATE_LIMIT_CAPACITY, env.RATE_LIMIT_REFILL_PER_SECOND);
}

export async function consumeRateLimitTokenWith(
  key: string,
  capacity: number,
  refillPerSecond: number,
): Promise<void> {
  const allowed = await rateLimitRepository.consumeToken({
    bucketKey: key,
    capacity,
    refillPerSecond,
  });
  if (!allowed) {
    throw AppError.rateLimited(Math.ceil(1 / refillPerSecond));
  }
}
