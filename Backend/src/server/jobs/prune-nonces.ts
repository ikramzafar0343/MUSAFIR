import { logger } from "@/lib/logger";
import { nonceRepository } from "@/server/database/repositories/nonce/nonce.repository";

export async function pruneExpiredNonces(): Promise<void> {
  try {
    const removed = await nonceRepository.deleteExpired();
    if (removed > 0) {
      logger.info({ removed }, "Pruned expired nonces");
    }
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : "error" }, "Nonce prune failed");
  }
}
