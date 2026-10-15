import type { LineCustomization } from "@/schemas/order";

export function CartLineHiddenFields({
  productId,
  size,
  color,
  customization,
  quantity,
}: {
  productId: string;
  size?: string | null | undefined;
  color?: string | null | undefined;
  customization?: LineCustomization | null | undefined;
  quantity?: number | undefined;
}) {
  return (
    <>
      <input type="hidden" name="productId" value={productId} />
      {size ? <input type="hidden" name="size" value={size} /> : null}
      {color ? <input type="hidden" name="color" value={color} /> : null}
      {customization ? <input type="hidden" name="customization" value={JSON.stringify(customization)} /> : null}
      {quantity !== undefined ? <input type="hidden" name="quantity" value={quantity} /> : null}
    </>
  );
}
