import { query } from "@/server/database/query";

export type ContactRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: Date;
};

export class ContactRepository {
  async insert(input: { name: string; email: string; message: string }): Promise<ContactRow> {
    const result = await query<ContactRow>(
      `INSERT INTO contact_message (name, email, message)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, message, status, created_at`,
      [input.name, input.email, input.message],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("Contact insert returned no row");
    }
    return row;
  }
}

export const contactRepository = new ContactRepository();
