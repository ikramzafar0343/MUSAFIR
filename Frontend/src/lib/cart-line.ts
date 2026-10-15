import { customizationSchema,type LineCustomization } from "@/schemas/order";

export function customizationFingerprint(customization: LineCustomization | null | undefined): string {
  if (!customization?.name) {
    return "";
  }
  return JSON.stringify({
    name: customization.name,
    logoUrl: customization.logoUrl ?? "",
    color: customization.color ?? "",
    notes: customization.notes ?? "",
  });
}

export type CartLineIdentity = {
  productId: string;
  size: string | null;
  color: string | null;
  customization: LineCustomization | null;
};

export function sameCartLine(
  left: {
    productId: string;
    size?: string | null | undefined;
    color?: string | null | undefined;
    customization?: LineCustomization | null | undefined;
  },
  right: CartLineIdentity,
): boolean {
  return (
    left.productId === right.productId &&
    (left.size ?? null) === right.size &&
    (left.color ?? null) === right.color &&
    customizationFingerprint(left.customization) === customizationFingerprint(right.customization)
  );
}

export function readCustomizationInput(formData: FormData): LineCustomization | null {
  const raw = String(formData.get("customization") ?? "").trim();
  if (!raw) {
    return null;
  }
  try {
    const parsed = customizationSchema.safeParse(JSON.parse(raw) as unknown);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
