import pg from "pg";

import { getEnv } from "@/lib/env";
import { loadDotEnv } from "@/lib/load-dot-env";

loadDotEnv();

const env = getEnv();

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.PG_POOL_MAX,
  idleTimeoutMillis: env.PG_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.PG_CONNECTION_TIMEOUT_MS,
  options: `-c statement_timeout=${env.PG_STATEMENT_TIMEOUT_MS}`,
});

export async function closePool(): Promise<void> {
  await pool.end();
}

export async function databaseHealth(): Promise<{ readonly status: "connected" | "disconnected" }> {
  try {
    await pool.query("SELECT 1 AS ok");
    return { status: "connected" };
  } catch {
    return { status: "disconnected" };
  }
}
