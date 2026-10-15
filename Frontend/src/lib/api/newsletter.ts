import { apiRequest } from "@/lib/api/client";

export const newsletterService = {
  subscribe: async (email: string) => apiRequest<{ ok: boolean }>("POST", "/newsletter", { email }),
};
