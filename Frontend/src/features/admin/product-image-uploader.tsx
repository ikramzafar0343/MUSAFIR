"use client";

import { useId, useRef, useState } from "react";

import { IconClose, IconPlus } from "@/components/icons/icons";
import { CmsImage } from "@/features/media/cms-image";

const MAX_IMAGES = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp";

export type ProductImageSlot = {
  id: string;
  preview: string;
  file: File | null;
  url: string;
};

export function createImageSlot(image?: { url: string }): ProductImageSlot {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    preview: image?.url ?? "",
    file: null,
    url: image?.url ?? "",
  };
}

export function ProductImageUploader({
  slots,
  onChange,
  error,
}: {
  slots: ProductImageSlot[];
  onChange: (slots: ProductImageSlot[]) => void;
  error?: string | undefined;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState("");
  const primary = slots[0];
  const message = error || localError;

  function addFiles(fileList: FileList | File[]) {
    const next = [...slots];
    const problems: string[] = [];
    for (const file of Array.from(fileList)) {
      if (next.length >= MAX_IMAGES) {
        problems.push(`You can add up to ${MAX_IMAGES} photos.`);
        break;
      }
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        problems.push(`${file.name} must be PNG, JPG, or WEBP.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        problems.push(`${file.name} must be 5MB or smaller.`);
        continue;
      }
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        preview: URL.createObjectURL(file),
        file,
        url: "",
      });
    }
    setLocalError(problems[0] ?? "");
    onChange(next);
  }

  function removeAt(index: number) {
    const slot = slots[index];
    if (slot?.file && slot.preview.startsWith("blob:")) {
      URL.revokeObjectURL(slot.preview);
    }
    onChange(slots.filter((_, itemIndex) => itemIndex !== index));
  }

  function setPrimary(index: number) {
    if (index <= 0) {
      return;
    }
    const next = [...slots];
    const [picked] = next.splice(index, 1);
    if (picked) {
      next.unshift(picked);
    }
    onChange(next);
  }

  return (
    <div className="admin-product-upload-block">
      <input
        id={inputId}
        ref={inputRef}
        className="admin-product-upload-input"
        type="file"
        accept={ACCEPT}
        multiple
        onChange={(event) => {
          if (event.target.files) {
            addFiles(event.target.files);
          }
          event.target.value = "";
        }}
      />
      <button
        type="button"
        className={`admin-product-stage${dragOver ? " is-over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (event.dataTransfer.files.length) {
            addFiles(event.dataTransfer.files);
          }
        }}
        aria-label={primary ? "Replace or add product photos" : "Upload product photos"}
      >
        {primary?.preview ? (
          primary.preview.startsWith("blob:") ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img src={primary.preview} alt="Main product photo" className="admin-product-stage-image" />
          ) : (
            <CmsImage src={primary.preview} alt="Main product photo" width={420} height={280} className="admin-product-stage-image" />
          )
        ) : (
          <span className="admin-product-stage-empty">Drop a photo here or click to upload</span>
        )}
      </button>
      <div className="admin-product-thumb-row">
        {slots.map((slot, index) => (
          <div key={slot.id} className={`admin-product-thumb${index === 0 ? " is-active" : ""}`}>
            <button type="button" className="admin-product-thumb-pick" onClick={() => setPrimary(index)} aria-label={`Set photo ${index + 1} as main`}>
              {slot.preview.startsWith("blob:") ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                <img src={slot.preview} alt="" className="admin-product-thumb-img" />
              ) : (
                <CmsImage src={slot.preview} alt="" width={48} height={48} className="admin-product-thumb-img" />
              )}
            </button>
            <button type="button" className="admin-product-thumb-remove" onClick={() => removeAt(index)} aria-label={`Remove photo ${index + 1}`}>
              <IconClose />
            </button>
          </div>
        ))}
        {slots.length < MAX_IMAGES ? (
          <button type="button" className="admin-product-thumb-add" onClick={() => inputRef.current?.click()} aria-label="Add photo">
            <IconPlus />
          </button>
        ) : null}
      </div>
      {message ? (
        <p className="admin-product-error" role="alert">
          {message}
        </p>
      ) : (
        <p className="admin-product-kicker">PNG, JPG, or WEBP. Up to 5MB each. First photo is the shop image.</p>
      )}
    </div>
  );
}
