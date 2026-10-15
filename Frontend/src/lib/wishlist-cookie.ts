import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { wishlistCookieName } from "@/constants/cookies";
import { getEnv } from "@/lib/env";
import { wishlistStateSchema } from "@/schemas/order";

export type WishlistState = { ids: string[] };

function sign(value: string): string {
  return createHmac("sha256", getEnv().SESSION_SECRET).update(value).digest("hex");
}

function encode(state: WishlistState): string {
  const payload = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(value: string | undefined): WishlistState {
  if (!value) {
    return { ids: [] };
  }
  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return { ids: [] };
  }
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ids: [] };
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
    return wishlistStateSchema.parse(parsed);
  } catch {
    return { ids: [] };
  }
}

export async function readWishlist(): Promise<WishlistState> {
  const store = await cookies();
  return decode(store.get(wishlistCookieName)?.value);
}

export async function writeWishlist(state: WishlistState): Promise<void> {
  const store = await cookies();
  store.set(wishlistCookieName, encode(state), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}
