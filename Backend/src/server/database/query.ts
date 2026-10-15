import type { PoolClient, QueryResult, QueryResultRow } from "pg";

import { logger } from "@/lib/logger";
import { mapPgError } from "@/server/database/map-pg-error";
import { pool } from "@/server/database/pool";

export type DbClient = PoolClient;

const SLOW_MS = 200;

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
  client?: PoolClient | undefined,
): Promise<QueryResult<T>> {
  const started = Date.now();
  const runner = client ?? pool;
  try {
    const result = await runner.query<T>(text, params);
    const duration = Date.now() - started;
    if (duration >= SLOW_MS) {
      logger.warn({ duration, queryName: text.split("\n")[0]?.trim() }, "Slow query");
    }
    return result;
  } catch (error) {
    mapPgError(error);
  }
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
