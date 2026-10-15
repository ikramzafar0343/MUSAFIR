import { AppError } from "@/lib/app-error";
import { query } from "@/server/database/query";
import { ERROR_CODES } from "@/types/api";

export class NonceRepository {
  async insert(nonceValue: string, expiresAt: Date): Promise<boolean> {
    try {
      await query(
        `INSERT INTO nonce (nonce_value, expires_at) VALUES ($1, $2)`,
        [nonceValue, expiresAt],
      );
      return true;
    } catch (error) {
      if (error instanceof AppError && error.code === ERROR_CODES.CONFLICT) {
        return false;
      }
      throw error;
    }
  }

  async deleteExpired(): Promise<number> {
    const result = await query(`DELETE FROM nonce WHERE expires_at < NOW()`);
    return result.rowCount ?? 0;
  }
}

export const nonceRepository = new NonceRepository();
