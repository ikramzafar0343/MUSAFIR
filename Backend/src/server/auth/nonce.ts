import { getEnv } from "@/lib/env";
import { nonceRepository } from "@/server/database/repositories/nonce/nonce.repository";

export async function consumeNonce(nonce: string): Promise<boolean> {
  const env = getEnv();
  return nonceRepository.insert(nonce, new Date(Date.now() + env.NONCE_TTL_SECONDS * 1000));
}
