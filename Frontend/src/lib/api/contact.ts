import { apiRequest } from "@/lib/api/client";

export type ContactRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
};

export const contactService = {
  create: async (input: { name: string; email: string; message: string }) =>
    apiRequest<ContactRow>("POST", "/contact", input),
};
