import { query } from "@/server/database/query";

export class RateLimitRepository {
  async consumeToken(input: {
    bucketKey: string;
    capacity: number;
    refillPerSecond: number;
  }): Promise<boolean> {
    const result = await query<{ tokens: string }>(
      `INSERT INTO rate_limit_bucket (
         bucket_key, tokens, capacity, refill_per_second, last_refill_at
       ) VALUES ($1, $2::numeric - 1, $2, $3, NOW())
       ON CONFLICT (bucket_key) DO UPDATE SET
         tokens = LEAST(
           rate_limit_bucket.capacity,
           rate_limit_bucket.tokens
             + EXTRACT(EPOCH FROM (NOW() - rate_limit_bucket.last_refill_at))
               * rate_limit_bucket.refill_per_second
         ) - 1,
         last_refill_at = NOW()
       WHERE LEAST(
         rate_limit_bucket.capacity,
         rate_limit_bucket.tokens
           + EXTRACT(EPOCH FROM (NOW() - rate_limit_bucket.last_refill_at))
             * rate_limit_bucket.refill_per_second
       ) >= 1
       RETURNING tokens`,
      [input.bucketKey, input.capacity, input.refillPerSecond],
    );
    return result.rowCount === 1;
  }
}

export const rateLimitRepository = new RateLimitRepository();
