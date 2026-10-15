import { z } from "zod";

import { emailSchema } from "@/schemas/common";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  message: z.string().trim().min(10).max(2000),
});
