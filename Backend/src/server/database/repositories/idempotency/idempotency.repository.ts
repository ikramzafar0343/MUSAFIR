import type { PoolClient } from "pg";

import { query } from "@/server/database/query";

export type IdempotencyRow = {
  key_value: string;
  request_hash: string;
  response_body: unknown;
};

export class IdempotencyRepository {
  async find(keyValue: string, client?: PoolClient): Promise<IdempotencyRow | null> {
    const result = await query<IdempotencyRow>(
      `SELECT key_value, request_hash, response_body
       FROM idempotency_key
       WHERE key_value = $1 AND expires_at > NOW()
       LIMIT 1`,
      [keyValue],
      client,
    );
    return result.rows[0] ?? null;
  }

  async reserve(
    input: {
      keyValue: string;
      requestHash: string;
      expiresAt: Date;
    },
    client: PoolClient,
  ): Promise<{ inserted: true } | { inserted: false; existing: IdempotencyRow }> {
    const result = await query<IdempotencyRow>(
      `INSERT INTO idempotency_key (key_value, request_hash, response_body, expires_at)
       VALUES ($1, $2, '{}'::jsonb, $3)
       ON CONFLICT (key_value) DO NOTHING
       RETURNING key_value, request_hash, response_body`,
      [input.keyValue, input.requestHash, input.expiresAt],
      client,
    );
    if (result.rows[0]) {
      return { inserted: true };
    }
    const existing = await this.find(input.keyValue, client);
    if (!existing) {
      throw new Error("Idempotency key conflict without existing row");
    }
    return { inserted: false, existing };
  }

  async updateResponse(keyValue: string, responseBody: unknown, client: PoolClient): Promise<void> {
    await query(
      `UPDATE idempotency_key
       SET response_body = $2::jsonb
       WHERE key_value = $1`,
      [keyValue, JSON.stringify(responseBody)],
      client,
    );
  }

  async insert(input: {
    keyValue: string;
    requestHash: string;
    responseBody: unknown;
    expiresAt: Date;
  }): Promise<void> {
    await query(
      `INSERT INTO idempotency_key (key_value, request_hash, response_body, expires_at)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (key_value) DO NOTHING`,
      [input.keyValue, input.requestHash, JSON.stringify(input.responseBody), input.expiresAt],
    );
  }
}

export const idempotencyRepository = new IdempotencyRepository();
