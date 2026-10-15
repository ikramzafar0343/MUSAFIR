"use client";

import { type ReactNode, useState } from "react";

export function ConfirmSubmit({
  message,
  label,
  className,
  confirmLabel = "Confirm",
}: {
  message: string;
  label: ReactNode;
  className?: string;
  confirmLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open ? (
        <div className="confirm-overlay">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <p className="confirm-dialog-copy">{message}</p>
            <div className="confirm-dialog-actions">
              <button type="submit" className="luxury-button-solid">
                {confirmLabel}
              </button>
              <button type="button" className="luxury-button-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
