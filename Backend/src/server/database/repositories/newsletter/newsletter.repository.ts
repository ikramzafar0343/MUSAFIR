import { query } from "@/server/database/query";

export class NewsletterRepository {
  async upsert(email: string, source = "footer"): Promise<void> {
    await query(
      `INSERT INTO newsletter_subscriber (email, source)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET source = EXCLUDED.source, updated_at = NOW()`,
      [email, source],
    );
  }
}

export const newsletterRepository = new NewsletterRepository();
