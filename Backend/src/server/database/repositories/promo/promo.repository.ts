import { query } from "@/server/database/query";

export type PromoRow = {
  id: string;
  code: string;
  discount_type: string;
  amount: string;
  min_subtotal: string;
  active: boolean;
  created_at: Date;
};

const COLUMNS = `id, code, discount_type, amount, min_subtotal, active, created_at`;

export class PromoRepository {
  async list(): Promise<PromoRow[]> {
    const result = await query<PromoRow>(`SELECT ${COLUMNS} FROM promo_code ORDER BY created_at DESC`);
    return result.rows;
  }

  async findActiveByCode(code: string): Promise<PromoRow | null> {
    const result = await query<PromoRow>(
      `SELECT ${COLUMNS} FROM promo_code WHERE upper(code) = upper($1) AND active = true LIMIT 1`,
      [code.trim()],
    );
    return result.rows[0] ?? null;
  }

  async insert(input: {
    code: string;
    discountType: string;
    amount: number;
    minSubtotal: number;
    active: boolean;
  }): Promise<PromoRow> {
    const result = await query<PromoRow>(
      `INSERT INTO promo_code (code, discount_type, amount, min_subtotal, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNS}`,
      [input.code.trim().toUpperCase(), input.discountType, input.amount, input.minSubtotal, input.active],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("Promo insert returned no row");
    }
    return row;
  }

  async setActive(id: string, active: boolean): Promise<PromoRow | null> {
    const result = await query<PromoRow>(
      `UPDATE promo_code SET active = $2 WHERE id = $1 RETURNING ${COLUMNS}`,
      [id, active],
    );
    return result.rows[0] ?? null;
  }
}

export const promoRepository = new PromoRepository();
