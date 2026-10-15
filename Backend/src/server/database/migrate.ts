import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { getEnv } from "@/lib/env";
import { loadDotEnv } from "@/lib/load-dot-env";
import { logger } from "@/lib/logger";

loadDotEnv();

const directory = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(directory, "../../../../Database/migrations");

export async function applyMigrations(): Promise<void> {
  const env = getEnv();
  const clientPool = new pg.Pool({ connectionString: env.DATABASE_MIGRATE_URL });
  try {
    await clientPool.query(`
      CREATE TABLE IF NOT EXISTS schema_migration (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);
    const applied = await clientPool.query<{ filename: string }>(
      "SELECT filename FROM schema_migration",
    );
    const done = new Set(applied.rows.map((row) => row.filename));
    const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
    for (const filename of files) {
      if (done.has(filename)) {
        continue;
      }
      const sql = await readFile(path.join(migrationsDir, filename), "utf8");
      const client = await clientPool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migration (filename) VALUES ($1)", [filename]);
        await client.query("COMMIT");
        logger.info({ filename }, "Applied migration");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }
  } finally {
    await clientPool.end();
  }
}

const entryScript = process.argv[1];
const invokedDirectly =
  Boolean(entryScript) &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(entryScript as string);

if (invokedDirectly) {
  void applyMigrations();
}
