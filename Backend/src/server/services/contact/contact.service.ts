import { brandName } from "@/constants/brand";
import { getEnv } from "@/lib/env";
import { contactRepository } from "@/server/database/repositories/contact/contact.repository";
import { sendMail } from "@/server/mail/mailer";

export class ContactService {
  async create(input: { name: string; email: string; message: string }) {
    const row = await contactRepository.insert(input);
    const env = getEnv();
    await sendMail({
      to: env.SUPPORT_EMAIL,
      replyTo: input.email,
      subject: `${brandName} contact from ${input.name}`,
      text: `From: ${input.name} <${input.email}>\n\n${input.message}`,
    });
    return row;
  }
}

export const contactService = new ContactService();
