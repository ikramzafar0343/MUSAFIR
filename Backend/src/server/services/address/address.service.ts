import { AppError } from "@/lib/app-error";
import { addressRepository } from "@/server/database/repositories/address/address.repository";

export class AddressService {
  async list(accountId: string) {
    return addressRepository.listByAccount(accountId);
  }

  async save(
    accountId: string,
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
  ) {
    const payload = {
      label: input.label.trim() || "Home",
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      postalCode: input.postalCode.trim(),
      isDefault: input.isDefault,
    };
    if (input.id) {
      const updated = await addressRepository.update(input.id, accountId, payload);
      if (!updated) {
        throw AppError.notFound("Address not found");
      }
      return updated;
    }
    return addressRepository.insert({ accountId, ...payload });
  }

  async remove(accountId: string, id: string) {
    const removed = await addressRepository.remove(id, accountId);
    if (!removed) {
      throw AppError.notFound("Address not found");
    }
  }
}

export const addressService = new AddressService();
