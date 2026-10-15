import type { PoolClient } from "pg";

import { query } from "@/server/database/query";

export type SessionRow = {
  id: string;
  token_hash: string;
  account_id: string;
  expires_at: Date;
};

export class SessionRepository {
  async insert(input: {
    tokenHash: string;
    accountId: string;
    expiresAt: Date;
    ip?: string | undefined;
    userAgent?: string | undefined;
  }): Promise<void> {
    await query(
      `INSERT INTO session (token_hash, account_id, expires_at, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [input.tokenHash, input.accountId, input.expiresAt, input.ip ?? null, input.userAgent ?? null],
    );
  }

  async findValidByTokenHash(tokenHash: string, client?: PoolClient): Promise<SessionRow | null> {
    const result = await query<SessionRow>(
      `SELECT id, token_hash, account_id, expires_at
       FROM session
       WHERE token_hash = $1 AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
      client,
    );
    return result.rows[0] ?? null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await query(`DELETE FROM session WHERE token_hash = $1`, [tokenHash]);
  }
}

export const sessionRepository = new SessionRepository();
