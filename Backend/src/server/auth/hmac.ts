import { AppError } from "@/lib/app-error";
import { hmacSign, sha256Hex, timingSafeHexEqual } from "@/lib/crypto";
import { getEnv } from "@/lib/env";
import { consumeNonce } from "@/server/auth/nonce";

export async function verifyHmac(params: {
  method: string;
  path: string;
  timestampHeader: string | undefined;
  nonceHeader: string | undefined;
  signatureHeader: string | undefined;
  rawBody: string;
}): Promise<void> {
  const env = getEnv();
  const timestamp = params.timestampHeader ?? "";
  const nonce = params.nonceHeader ?? "";
  const signature = params.signatureHeader ?? "";

  if (!timestamp || !nonce || !signature) {
    throw AppError.unauthenticated("HMAC headers required");
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    throw AppError.unauthenticated("Invalid timestamp");
  }
  const delta = Math.abs(Date.now() / 1000 - ts);
  if (delta > env.HMAC_TIMESTAMP_WINDOW_SECONDS) {
    throw AppError.expired();
  }

  const expected = hmacSign({
    method: params.method,
    path: params.path,
    timestamp,
    nonce,
    bodyHash: sha256Hex(params.rawBody),
    secret: env.HMAC_SIGNING_SECRET,
  });

  if (!timingSafeHexEqual(expected, signature.toLowerCase())) {
    throw AppError.unauthenticated("Invalid signature");
  }

  const accepted = await consumeNonce(nonce);
  if (!accepted) {
    throw AppError.replay();
  }
}
