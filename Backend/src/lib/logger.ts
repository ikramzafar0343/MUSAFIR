import pino from "pino";

const level = process.env.NODE_ENV === "test" ? "silent" : "info";

export const logger = pino({
  level,
  base: { service: "musafir" },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers.x-signature",
      "password",
      "passwordHash",
      "HMAC_SIGNING_SECRET",
      "SESSION_SECRET",
      "SMTP_PASS",
    ],
    remove: true,
  },
});
