import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { orderReceiptCookieName } from "@/constants/cookies";
import { getEnv } from "@/lib/env";

export type OrderReceipt = {
  orderNumber: string;
  email: string;
  exp: number;
};

const RECEIPT_MAX_AGE_SECONDS = 60 * 60;

function sign(value: string): string {
  return createHmac("sha256", getEnv().SESSION_SECRET).update(value).digest("hex");
}

function encode(receipt: OrderReceipt): string {
  const payload = Buffer.from(JSON.stringify(receipt), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(value: string | undefined): OrderReceipt | null {
  if (!value) {
    return null;
  }
  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return null;
  }
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OrderReceipt;
    if (
      typeof parsed.orderNumber !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    if (parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeOrderReceipt(orderNumber: string, email: string): Promise<void> {
  const store = await cookies();
  const receipt: OrderReceipt = {
    orderNumber: orderNumber.toUpperCase(),
    email: email.toLowerCase().trim(),
    exp: Date.now() + RECEIPT_MAX_AGE_SECONDS * 1000,
  };
  store.set(orderReceiptCookieName, encode(receipt), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: RECEIPT_MAX_AGE_SECONDS,
  });
}

export async function readOrderReceipt(): Promise<OrderReceipt | null> {
  const store = await cookies();
  return decode(store.get(orderReceiptCookieName)?.value);
}
