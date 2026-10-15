import type { LineCustomization } from "@/schemas/order";
import { query } from "@/server/database/query";

export type BagItem = {
  productId: string;
  quantity: number;
  size?: string | null | undefined;
  color?: string | null | undefined;
  colorHex?: string | null | undefined;
  customization?: LineCustomization | null | undefined;
};

export class BagRepository {
  async find(accountId: string): Promise<BagItem[]> {
    const result = await query<{ items: BagItem[] }>(
      `SELECT items FROM account_bag WHERE account_id = $1 LIMIT 1`,
      [accountId],
    );
    const items = result.rows[0]?.items;
    return Array.isArray(items) ? items : [];
  }

  async upsert(accountId: string, items: BagItem[]): Promise<void> {
    await query(
      `INSERT INTO account_bag (account_id, items, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (account_id)
       DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
      [accountId, JSON.stringify(items)],
    );
  }
}

export const bagRepository = new BagRepository();
