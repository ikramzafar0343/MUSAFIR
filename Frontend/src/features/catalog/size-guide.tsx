"use client";

import { useState } from "react";

import { IconClose } from "@/components/icons/icons";

export function SizeGuide({
  sizes,
  howToUse,
}: {
  sizes: string[];
  howToUse: string;
}) {
  const [open, setOpen] = useState(false);
  if (sizes.length === 0 && !howToUse) {
    return null;
  }
  return (
    <>
      <button type="button" className="product-guide-btn" onClick={() => setOpen(true)}>
        Size and how to use
      </button>
      {open ? (
        <div className="confirm-overlay">
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="size-guide-title">
            <div className="confirm-dialog-head">
              <h2 id="size-guide-title" className="confirm-dialog-title">
                Size and how to use
              </h2>
              <button type="button" className="mini-cart-close" aria-label="Close" onClick={() => setOpen(false)}>
                <IconClose />
              </button>
            </div>
            {sizes.length > 0 ? (
              <p className="confirm-dialog-copy">Available sizes: {sizes.join(", ")}</p>
            ) : null}
            {howToUse ? <p className="confirm-dialog-copy">{howToUse}</p> : null}
            <button type="button" className="luxury-button-solid" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
