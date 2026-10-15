import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendEnv = path.join(repo, "Backend", ".env");
const frontendEnv = path.join(repo, "Frontend", ".env");
const frontendEnvLocal = path.join(repo, "Frontend", ".env.local");

function readEnvValue(file, key) {
  if (!existsSync(file)) {
    return "";
  }
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (line.startsWith(`${key}=`)) {
      return line.slice(key.length + 1).trim();
    }
  }
  return "";
}

function frontendEnvText(hmac, session) {
  return [
    "NODE_ENV=development",
    "APP_URL=http://localhost:3000",
    "API_URL=http://127.0.0.1:5000",
    "API_PREFIX=/api/v1",
    `HMAC_SIGNING_SECRET=${hmac}`,
    `SESSION_SECRET=${session}`,
    "SESSION_TTL_SECONDS=604800",
    "",
  ].join("\n");
}

export function writeLocalEnvIfMissing() {
  const existingHmac = readEnvValue(backendEnv, "HMAC_SIGNING_SECRET") || readEnvValue(frontendEnv, "HMAC_SIGNING_SECRET");
  const existingSession = readEnvValue(backendEnv, "SESSION_SECRET") || readEnvValue(frontendEnv, "SESSION_SECRET");
  const hmac = existingHmac || randomBytes(32).toString("hex");
  const session = existingSession || randomBytes(32).toString("hex");
  const frontend = frontendEnvText(hmac, session);
  let wrote = false;

  // Keep Frontend HMAC/session aligned with Backend — login fails when they drift.
  const feHmac = readEnvValue(frontendEnv, "HMAC_SIGNING_SECRET");
  const feSession = readEnvValue(frontendEnv, "SESSION_SECRET");
  const felHmac = readEnvValue(frontendEnvLocal, "HMAC_SIGNING_SECRET");
  const felSession = readEnvValue(frontendEnvLocal, "SESSION_SECRET");
  if (existsSync(backendEnv) && (feHmac !== hmac || feSession !== session || !existsSync(frontendEnv))) {
    writeFileSync(frontendEnv, frontend);
    wrote = true;
  }
  if (existsSync(backendEnv) && (felHmac !== hmac || felSession !== session || !existsSync(frontendEnvLocal))) {
    writeFileSync(frontendEnvLocal, frontend);
    wrote = true;
  }

  if (!existsSync(backendEnv)) {
    const db = "postgresql://postgres:musafir_local@127.0.0.1:54321/musafir";
    writeFileSync(
      backendEnv,
      [
        "NODE_ENV=development",
        "APP_URL=http://localhost:3000",
        "API_HOST=127.0.0.1",
        "API_PORT=5000",
        "API_PREFIX=/api/v1",
        `DATABASE_URL=${db}`,
        `DATABASE_MIGRATE_URL=${db}`,
        "PG_POOL_MAX=10",
        "PG_IDLE_TIMEOUT_MS=10000",
        "PG_CONNECTION_TIMEOUT_MS=10000",
        "PG_STATEMENT_TIMEOUT_MS=15000",
        `HMAC_SIGNING_SECRET=${hmac}`,
        `SESSION_SECRET=${session}`,
        "SESSION_TTL_SECONDS=604800",
        "NONCE_TTL_SECONDS=600",
        "HMAC_TIMESTAMP_WINDOW_SECONDS=300",
        "RATE_LIMIT_CAPACITY=400",
        "RATE_LIMIT_REFILL_PER_SECOND=2",
        "CORS_ORIGIN=http://localhost:3000",
        "SUPPORT_EMAIL=support@example.com",
        "EMAIL_FROM=MUSAFIR <noreply@example.com>",
        "SMTP_HOST=",
        "SMTP_PORT=465",
        "SMTP_SECURE=true",
        "SMTP_USER=",
        "SMTP_PASS=",
        "WHATSAPP_PROVIDER=auto",
        "ULTRAMSG_INSTANCE_ID=",
        "ULTRAMSG_TOKEN=",
        "WHATSAPP_ACCESS_TOKEN=",
        "WHATSAPP_PHONE_NUMBER_ID=",
        "WHATSAPP_API_VERSION=v21.0",
        "UPLOAD_MAX_FILE_SIZE=41943040",
        "UPLOAD_DIR=../Frontend/public/uploads",
        "STORAGE_PROVIDER=local",
        "SEED_ADMIN_EMAIL=admin@example.com",
        "SEED_ADMIN_PASSWORD=ChangeMeAdmin123!",
        "SEED_ADMIN_NAME=MUSAFIR Admin",
        "ADMIN_PASSCODE=1234",
        "",
      ].join("\n"),
    );
    wrote = true;
  }
  if (!existsSync(frontendEnv)) {
    writeFileSync(frontendEnv, frontend);
    wrote = true;
  }
  if (!existsSync(frontendEnvLocal)) {
    writeFileSync(frontendEnvLocal, frontend);
    wrote = true;
  }
  return wrote;
}

const invokedDirectly =
  Boolean(process.argv[1]) && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (invokedDirectly) {
  const wrote = writeLocalEnvIfMissing();
  console.log(wrote ? "env files written" : "env files already present");
}
