import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { writeLocalEnvIfMissing } from "./write-local-env.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(repo, ".pgdata");
const logFile = path.join(dataDir, "postgres.log");
export const LOCAL_PG_PORT = 54321;
export const LOCAL_PG_DATABASE = "musafir";
export const LOCAL_PG_USER = "postgres";

const BIN_CANDIDATES = [
  "C:\\Program Files\\PostgreSQL\\16\\bin",
  "C:\\Program Files\\PostgreSQL\\17\\bin",
  "C:\\Program Files\\PostgreSQL\\18\\bin",
];

function findBin() {
  for (const dir of BIN_CANDIDATES) {
    if (existsSync(path.join(dir, "pg_ctl.exe")) || existsSync(path.join(dir, "pg_ctl"))) {
      return dir;
    }
  }
  throw new Error("PostgreSQL 16/18 binaries were not found. Install PostgreSQL locally first.");
}

function bin(name) {
  const directory = findBin();
  const windows = path.join(directory, `${name}.exe`);
  if (existsSync(windows)) {
    return windows;
  }
  return path.join(directory, name);
}

function run(command, args, options = {}) {
  const env = { ...process.env, PGCONNECT_TIMEOUT: "8" };
  delete env.PGPASSWORD;
  const result = spawnSync(command, args, {
    encoding: "utf8",
    windowsHide: true,
    env,
    ...options,
  });
  if (result.status !== 0 && options.allowFailure !== true) {
    const detail = (result.stderr || result.stdout || "").trim();
    throw new Error(`${path.basename(command)} ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`);
  }
  return result;
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.setTimeout(750, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForPort(port, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await portOpen(port)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`PostgreSQL did not become ready on 127.0.0.1:${port}`);
}

function initCluster() {
  if (existsSync(path.join(dataDir, "PG_VERSION"))) {
    return;
  }
  mkdirSync(dataDir, { recursive: true });
  const attempts = [
    ["-D", dataDir, "-U", LOCAL_PG_USER, "-A", "trust", "-E", "UTF8", "--no-locale"],
    ["-D", dataDir, "-U", LOCAL_PG_USER, "-A", "trust", "-E", "UTF8", "--locale=C"],
  ];
  let lastError = null;
  for (const args of attempts) {
    try {
      run(bin("initdb"), args);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("initdb failed");
}

function clusterRunning() {
  const result = run(bin("pg_ctl"), ["-D", dataDir, "status"], { allowFailure: true });
  return result.status === 0;
}

function startCluster() {
  if (clusterRunning()) {
    return;
  }
  run(bin("pg_ctl"), ["-D", dataDir, "-l", logFile, "-o", `-p ${LOCAL_PG_PORT}`, "start"]);
}

function ensureDatabase() {
  const exists = run(bin("psql"), [
    "-h",
    "127.0.0.1",
    "-p",
    String(LOCAL_PG_PORT),
    "-U",
    LOCAL_PG_USER,
    "-d",
    "postgres",
    "-w",
    "-Atc",
    `SELECT 1 FROM pg_database WHERE datname = '${LOCAL_PG_DATABASE}'`,
  ]);
  if (String(exists.stdout).trim() === "1") {
    return;
  }
  run(bin("createdb"), [
    "-h",
    "127.0.0.1",
    "-p",
    String(LOCAL_PG_PORT),
    "-U",
    LOCAL_PG_USER,
    "-w",
    LOCAL_PG_DATABASE,
  ]);
}

export async function ensureLocalPostgres() {
  writeLocalEnvIfMissing();
  console.log("Ensuring local PostgreSQL...");
  initCluster();
  if (!(await portOpen(LOCAL_PG_PORT))) {
    startCluster();
  }
  await waitForPort(LOCAL_PG_PORT);
  ensureDatabase();
}

export function stopLocalPostgres() {
  if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
    return;
  }
  run(bin("pg_ctl"), ["-D", dataDir, "-m", "fast", "stop"], { allowFailure: true });
}

const invokedDirectly =
  Boolean(process.argv[1]) && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (invokedDirectly) {
  if (process.argv[2] === "stop") {
    stopLocalPostgres();
  } else {
    await ensureLocalPostgres();
    console.log(`Local PostgreSQL ready on 127.0.0.1:${LOCAL_PG_PORT}/${LOCAL_PG_DATABASE}`);
  }
}
