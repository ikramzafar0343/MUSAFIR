import type { PoolClient } from "pg";

import type { Role } from "@/constants/roles";
import { query } from "@/server/database/query";

export type AccountRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  avatar_url: string | null;
  deleted_at: Date | null;
  admin_login_challenge_id: string | null;
  admin_login_otp_hash: string | null;
  admin_login_otp_expires: Date | null;
};

const ACCOUNT_COLUMNS = `id, name, email, password_hash, role, avatar_url, deleted_at,
  admin_login_challenge_id, admin_login_otp_hash, admin_login_otp_expires, last_login_at`;

export class AccountRepository {
  async findByEmail(email: string, client?: PoolClient): Promise<AccountRow | null> {
    const result = await query<AccountRow>(
      `SELECT ${ACCOUNT_COLUMNS} FROM account WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
      [email],
      client,
    );
    return result.rows[0] ?? null;
  }

  async findById(id: string, client?: PoolClient): Promise<AccountRow | null> {
    const result = await query<AccountRow>(
      `SELECT ${ACCOUNT_COLUMNS} FROM account WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id],
      client,
    );
    return result.rows[0] ?? null;
  }

  async findByAdminChallenge(challengeId: string): Promise<AccountRow | null> {
    const result = await query<AccountRow>(
      `SELECT ${ACCOUNT_COLUMNS} FROM account
       WHERE admin_login_challenge_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [challengeId],
    );
    return result.rows[0] ?? null;
  }

  async insert(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
  }): Promise<AccountRow> {
    const result = await query<AccountRow>(
      `INSERT INTO account (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${ACCOUNT_COLUMNS}`,
      [input.name, input.email, input.passwordHash, input.role],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("Account insert returned no row");
    }
    return row;
  }

  async markLogin(id: string): Promise<void> {
    await query(`UPDATE account SET last_login_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, [id]);
  }

  async setAdminChallenge(id: string, input: {
    challengeId: string;
    expiresAt: Date;
  }): Promise<void> {
    await query(
      `UPDATE account
       SET admin_login_challenge_id = $2,
           admin_login_otp_hash = NULL,
           admin_login_otp_expires = $3
       WHERE id = $1 AND deleted_at IS NULL`,
      [id, input.challengeId, input.expiresAt],
    );
  }

  async clearAdminChallenge(id: string): Promise<void> {
    await query(
      `UPDATE account
       SET admin_login_challenge_id = NULL,
           admin_login_otp_hash = NULL,
           admin_login_otp_expires = NULL,
           last_login_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await query(`UPDATE account SET password_hash = $2 WHERE id = $1 AND deleted_at IS NULL`, [id, passwordHash]);
  }

  async syncSeedAdmin(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
  }): Promise<AccountRow> {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      const result = await query<AccountRow>(
        `UPDATE account
         SET name = $2, password_hash = $3, role = $4
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING ${ACCOUNT_COLUMNS}`,
        [existing.id, input.name, input.passwordHash, input.role],
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error("Seed admin update returned no row");
      }
      return row;
    }
    return this.insert({
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
    });
  }

  async updateProfile(id: string, input: { name: string; email: string }): Promise<AccountRow | null> {
    const result = await query<AccountRow>(
      `UPDATE account SET name = $2, email = $3 WHERE id = $1 AND deleted_at IS NULL RETURNING ${ACCOUNT_COLUMNS}`,
      [id, input.name, input.email],
    );
    return result.rows[0] ?? null;
  }
}

export const accountRepository = new AccountRepository();
