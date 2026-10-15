import { query } from "@/server/database/query";

export type AddressRow = {
  id: string;
  account_id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
};

const COLUMNS = `id, account_id, label, full_name, phone, address, city, postal_code, is_default, created_at, updated_at`;

export class AddressRepository {
  async listByAccount(accountId: string): Promise<AddressRow[]> {
    const result = await query<AddressRow>(
      `SELECT ${COLUMNS} FROM user_address WHERE account_id = $1 ORDER BY is_default DESC, updated_at DESC`,
      [accountId],
    );
    return result.rows;
  }

  async findById(id: string, accountId: string): Promise<AddressRow | null> {
    const result = await query<AddressRow>(
      `SELECT ${COLUMNS} FROM user_address WHERE id = $1 AND account_id = $2 LIMIT 1`,
      [id, accountId],
    );
    return result.rows[0] ?? null;
  }

  async insert(input: {
    accountId: string;
    label: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
  }): Promise<AddressRow> {
    if (input.isDefault) {
      await query(`UPDATE user_address SET is_default = false WHERE account_id = $1`, [input.accountId]);
    }
    const result = await query<AddressRow>(
      `INSERT INTO user_address (account_id, label, full_name, phone, address, city, postal_code, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING ${COLUMNS}`,
      [
        input.accountId,
        input.label,
        input.fullName,
        input.phone,
        input.address,
        input.city,
        input.postalCode,
        input.isDefault,
      ],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("Address insert returned no row");
    }
    return row;
  }

  async update(
    id: string,
    accountId: string,
    input: {
      label: string;
      fullName: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
      isDefault: boolean;
    },
  ): Promise<AddressRow | null> {
    if (input.isDefault) {
      await query(`UPDATE user_address SET is_default = false WHERE account_id = $1`, [accountId]);
    }
    const result = await query<AddressRow>(
      `UPDATE user_address
       SET label = $3, full_name = $4, phone = $5, address = $6, city = $7, postal_code = $8, is_default = $9
       WHERE id = $1 AND account_id = $2
       RETURNING ${COLUMNS}`,
      [
        id,
        accountId,
        input.label,
        input.fullName,
        input.phone,
        input.address,
        input.city,
        input.postalCode,
        input.isDefault,
      ],
    );
    return result.rows[0] ?? null;
  }

  async remove(id: string, accountId: string): Promise<boolean> {
    const result = await query(`DELETE FROM user_address WHERE id = $1 AND account_id = $2`, [id, accountId]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const addressRepository = new AddressRepository();
