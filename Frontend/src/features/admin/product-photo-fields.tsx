"use client";

import { useEffect, useState } from "react";

import { CmsImage } from "@/features/media/cms-image";
import type { ProductImage } from "@/types/product";

const SLOTS = [
  { title: "Main photo", hint: "Used on inventory, shop cards, and the product page." },
  { title: "Photo 2", hint: "Optional extra angle." },
  { title: "Photo 3", hint: "Optional extra angle." },
  { title: "Photo 4", hint: "Optional extra angle." },
] as const;

export function ProductPhotoFields({ images }: { images: readonly ProductImage[] }) {
  return (
    <div className="admin-product-photos">
      {SLOTS.map((slot, index) => (
        <PhotoSlot key={slot.title} index={index} title={slot.title} hint={slot.hint} image={images[index]} />
      ))}
    </div>
  );
}

function PhotoSlot({
  index,
  title,
  hint,
  image,
}: {
  index: number;
  title: string;
  hint: string;
  image?: ProductImage | undefined;
}) {
  const [url, setUrl] = useState(image?.url ?? "");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const preview = filePreview || url;

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  return (
    <div className="admin-product-photo">
      <p className="admin-product-photo-title">{title}</p>
      <p className="admin-product-hint">{hint}</p>
      <div className="admin-product-photo-preview">
        {preview ? (
          <CmsImage src={preview} alt={title} width={240} height={300} className="admin-product-photo-image" />
        ) : (
          <span className="admin-product-photo-empty">No photo yet</span>
        )}
      </div>
      <label className="admin-product-photo-file">
        <input
          className="admin-product-upload-input"
          type="file"
          name={`imageFile${index + 1}`}
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            setFilePreview((current) => {
              if (current) {
                URL.revokeObjectURL(current);
              }
              return URL.createObjectURL(file);
            });
          }}
        />
        <span>{preview ? "Replace photo" : "Upload photo"}</span>
      </label>
      <label className="admin-product-field" htmlFor={`imageUrl${index + 1}`}>
        <span className="admin-product-label">Or paste image path</span>
        <input
          id={`imageUrl${index + 1}`}
          className="admin-product-input"
          name={`imageUrl${index + 1}`}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="/assets/images/musafir-coats-blazers.png"
        />
      </label>
    </div>
  );
}
