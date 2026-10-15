import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ensureLocalPostgres } from "./local-postgres.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, "..");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

await ensureLocalPostgres();

const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(repo, "Backend"),
  stdio: "inherit",
  env: process.env,
  shell: isWin,
});

const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(repo, "Frontend"),
  stdio: "inherit",
  env: process.env,
  shell: isWin,
});

const shutdown = (signal) => {
  backend.kill(signal);
  frontend.kill(signal);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
