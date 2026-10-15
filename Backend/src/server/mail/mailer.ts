import nodemailer from "nodemailer";

import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const env = getEnv();
  if (!env.SMTP_HOST || !env.SMTP_PORT) {
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: Boolean(env.SMTP_SECURE),
      auth: env.SMTP_USER
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
    });
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });
    return true;
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : "mail failed" }, "Unable to send email");
    return false;
  }
}
