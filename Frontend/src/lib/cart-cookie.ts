import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { cartCookieName } from "@/constants/cookies";
import { bagApi, type BagItem } from "@/lib/api/bag";
import { sameCartLine } from "@/lib/cart-line";
import { getEnv } from "@/lib/env";
import { getSessionUser } from "@/lib/session";
import { cartStateSchema } from "@/schemas/order";

export type CartItem = BagItem;

export type CartState = { items: CartItem[] };

function sign(value: string): string {
  return createHmac("sha256", getEnv().SESSION_SECRET).update(value).digest("hex");
}

function encode(state: CartState): string {
  const payload = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(value: string | undefined): CartState {
  if (!value) {
    return { items: [] };
  }
  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return { items: [] };
  }
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { items: [] };
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
    return cartStateSchema.parse(parsed);
  } catch {
    return { items: [] };
  }
}

function sameLine(left: CartItem, right: CartItem): boolean {
  return sameCartLine(left, {
    productId: right.productId,
    size: right.size ?? null,
    color: right.color ?? null,
    customization: right.customization ?? null,
  });
}

export async function readCart(): Promise<CartState> {
  const store = await cookies();
  return decode(store.get(cartCookieName)?.value);
}

export async function writeCart(state: CartState): Promise<void> {
  const store = await cookies();
  store.set(cartCookieName, encode(state), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  const user = await getSessionUser();
  if (user) {
    await bagApi.upsert(state.items);
  }
}

export async function mergeAccountBag(): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    return;
  }
  const cookie = await readCart();
  const stored = await bagApi.find();
  const items = [...cookie.items];
  for (const line of stored) {
    if (!items.some((item) => sameLine(item, line))) {
      items.push(line);
    }
  }
  await writeCart({ items });
}
