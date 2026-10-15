import { apiRequest } from "@/lib/api/client";

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
};

export const addressService = {
  list: async (_accountId: string) => apiRequest<AddressRow[]>("GET", "/account/addresses"),
  save: async (
    _accountId: string,
    input: {
      id?: string | undefined;
      label: string;
      fullName: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
      isDefault: boolean;
    },
  ) => apiRequest<AddressRow>("POST", "/account/addresses", input),
  remove: async (_accountId: string, id: string) => apiRequest<{ ok: boolean }>("DELETE", `/account/addresses/${id}`),
};
