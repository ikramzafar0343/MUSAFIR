import { loadDotEnv } from "@/lib/load-dot-env";
import { logger } from "@/lib/logger";
import { closePool } from "@/server/database/pool";
import { authService } from "@/server/services/auth/auth.service";

loadDotEnv();

async function seedAdmin(): Promise<void> {
  const user = await authService.seedAdmin();
  logger.info({ email: user.email }, "Admin seed completed");
  await closePool();
}

void seedAdmin();
