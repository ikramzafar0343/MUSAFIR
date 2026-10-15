"use client";

import { useRef } from "react";

type UploadZoneProps = {
  disabled?: boolean;
  onFile: (file: File) => void;
};

const ACCEPT = "image/png,image/jpeg,image/webp,image/avif,.png,.jpg,.jpeg,.webp,.avif";

export function UploadZone({ disabled, onFile }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(fileList: FileList | null) {
    const file = fileList?.[0];
    if (file) {
      onFile(file);
    }
  }

  return (
    <div
      className={`admin-bg-upload${disabled ? " is-disabled" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (disabled) {
          return;
        }
        pick(event.dataTransfer.files);
      }}
    >
      <p className="admin-bg-upload-title">Drop a product photo</p>
      <p className="admin-bg-upload-hint">PNG, JPEG, WebP, or AVIF · max 12MB</p>
      <button
        type="button"
        className="admin-product-ghost"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Choose file
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          pick(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
