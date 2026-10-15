import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, "..");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

// Production/VPS: use DATABASE_URL from env (Postgres on the server).
// Local bundled Postgres is only started via `npm run dev` / `npm run db:local`.
if (process.env.USE_LOCAL_POSTGRES === "1") {
  const { ensureLocalPostgres } = await import("./local-postgres.mjs");
  await ensureLocalPostgres();
}

const backend = spawn(npmCmd, ["run", "start"], {
  cwd: path.join(repo, "Backend"),
  stdio: "inherit",
  env: process.env,
  shell: isWin,
});

const frontend = spawn(npmCmd, ["run", "start"], {
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
