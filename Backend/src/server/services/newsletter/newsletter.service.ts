import { newsletterRepository } from "@/server/database/repositories/newsletter/newsletter.repository";

export class NewsletterService {
  async subscribe(email: string, source = "footer"): Promise<void> {
    await newsletterRepository.upsert(email.toLowerCase().trim(), source);
  }
}

export const newsletterService = new NewsletterService();
