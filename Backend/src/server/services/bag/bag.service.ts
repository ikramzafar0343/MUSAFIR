import { type BagItem, bagRepository } from "@/server/database/repositories/bag/bag.repository";

export class BagService {
  async find(accountId: string) {
    return bagRepository.find(accountId);
  }

  async upsert(accountId: string, items: BagItem[]) {
    await bagRepository.upsert(accountId, items);
    return items;
  }
}

export const bagService = new BagService();
