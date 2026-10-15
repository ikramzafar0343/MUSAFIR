import { z } from "zod";

const booleanFromString = z.preprocess((value) => {
  if (value === "true") {
    return true;
  }
  if (value === "false" || value === "" || value === undefined) {
    return false;
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  APP_URL: z.string().url(),
  API_HOST: z.string().min(1),
  API_PORT: z.coerce.number().int().min(1).max(65535),
  API_PREFIX: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DATABASE_MIGRATE_URL: z.string().min(1),
  PG_POOL_MAX: z.coerce.number().int().positive(),
  PG_IDLE_TIMEOUT_MS: z.coerce.number().int().positive(),
  PG_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive(),
  PG_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive(),
  HMAC_SIGNING_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive(),
  NONCE_TTL_SECONDS: z.coerce.number().int().positive(),
  HMAC_TIMESTAMP_WINDOW_SECONDS: z.coerce.number().int().positive(),
  RATE_LIMIT_CAPACITY: z.coerce.number().int().positive(),
  RATE_LIMIT_REFILL_PER_SECOND: z.coerce.number().positive(),
  CORS_ORIGIN: z.string().min(1),
  SUPPORT_EMAIL: z.string().email(),
  EMAIL_FROM: z.string().min(1),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_SECURE: booleanFromString.optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  /** ultramsg | meta | auto (default) */
  WHATSAPP_PROVIDER: z.enum(["ultramsg", "meta", "auto"]).optional(),
  ULTRAMSG_INSTANCE_ID: z.string().optional(),
  ULTRAMSG_TOKEN: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_API_VERSION: z.string().optional(),
  UPLOAD_MAX_FILE_SIZE: z.coerce.number().int().positive(),
  UPLOAD_DIR: z.string().min(1),
  STORAGE_PROVIDER: z.enum(["local", "cloudinary", "s3"]),
  SEED_ADMIN_EMAIL: z.string().email(),
  SEED_ADMIN_PASSWORD: z.string().min(8),
  SEED_ADMIN_NAME: z.string().min(1),
  ADMIN_PASSCODE: z.string().regex(/^\d{4}$/, "ADMIN_PASSCODE must be a 4-digit code"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) {
    return cached;
  }
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  cached = parsed.data;
  return cached;
}

export function corsOrigins(): string[] {
  const env = getEnv();
  return [...new Set([...env.CORS_ORIGIN.split(",").map((item) => item.trim().replace(/\/$/, "")), env.APP_URL.replace(/\/$/, "")])].filter(
    Boolean,
  );
}
