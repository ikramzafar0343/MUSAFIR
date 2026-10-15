import { spawnSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import path from "node:path";

import { getEnv } from "@/lib/env";
import { loadDotEnv } from "@/lib/load-dot-env";
import { logger } from "@/lib/logger";
import { applyMigrations } from "@/server/database/migrate";
import { closePool, databaseHealth, pool } from "@/server/database/pool";
import { handleApiRequest } from "@/server/http/handle-api-request";
import { prerenderHeroOnStartIfNeeded } from "@/server/jobs/prerender-hero-on-start";
import { pruneExpiredNonces } from "@/server/jobs/prune-nonces";
import { authService } from "@/server/services/auth/auth.service";

loadDotEnv();

const PRUNE_INTERVAL_MS = 5 * 60 * 1000;

process.on("unhandledRejection", (reason) => {
  logger.error(
    { err: reason instanceof Error ? reason.message : String(reason) },
    "Unhandled promise rejection",
  );
});

async function main(): Promise<void> {
  const env = getEnv();
  // Always migrate on container/process start (schema_migration table skips already-applied files).
  logger.info("Applying database migrations");
  await applyMigrations();
  logger.info("Database migrations complete");

  const health = await databaseHealth();
  if (health.status !== "connected") {
    throw new Error("PostgreSQL is not reachable");
  }

  // Background: a published hero that is still a plain clip gets converted to the cutout once.
  void prerenderHeroOnStartIfNeeded().catch((error) => {
    logger.error(
      { err: error instanceof Error ? error.message : String(error) },
      "Hero cutout conversion failed",
    );
  });

  if (env.NODE_ENV === "development") {
    const admin = await authService.seedAdmin();
    logger.info({ email: admin.email }, "Seed admin synced from environment");
    const catalog = await pool.query<{ n: number }>("SELECT count(*)::int AS n FROM product");
    if ((catalog.rows[0]?.n ?? 0) === 0) {
      const seedScript = path.resolve("scripts/seed-menswear.mjs");
      const seeded = spawnSync(process.execPath, [seedScript], { cwd: process.cwd(), stdio: "inherit" });
      if (seeded.status !== 0) {
        logger.warn({ status: seeded.status }, "Catalog seed script failed");
      }
    }
  }
  const server = createServer((req, res) => {
    void handleApiRequest(req, res).catch((err) => {
      logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        "Unhandled API request error",
      );
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: { code: "INTERNAL", message: "Internal server error" } }));
      }
    });
  });
  server.listen(env.API_PORT, env.API_HOST, () => {
    logger.info({ host: env.API_HOST, port: env.API_PORT }, "Native HTTP API listening");
  });
  const pruneTimer = setInterval(() => {
    void pruneExpiredNonces();
  }, PRUNE_INTERVAL_MS);
  pruneTimer.unref();
  bindShutdown(server);
}

function bindShutdown(server: Server): void {
  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info({ signal }, "Graceful shutdown started");
    server.close(() => {
      void closePool().then(() => {
        process.exit(0);
      });
    });
    setTimeout(() => {
      process.exit(1);
    }, 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

void main();
