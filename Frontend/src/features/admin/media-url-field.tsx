"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import { markAdminFormDirty } from "@/features/admin/unsaved-guard";
import { uploadAdminMediaAction } from "@/features/admin/upload-admin-media";
import { useAdminUploadBusy } from "@/features/admin/upload-busy";
import { CmsImage } from "@/features/media/cms-image";
import { isVideoSrc } from "@/lib/media-src";

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT =
  "image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-quicktime"]);

function isImageFile(file: File) {
  if (IMAGE_TYPES.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp");
}

function isVideoFile(file: File) {
  if (VIDEO_TYPES.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov");
}

/**
 * Image or video upload. Videos also store an auto-generated cover (poster) in
 * `${name}Poster` so the live frame can paint before playback.
 */
export function MediaUrlField({
  name,
  label,
  defaultValue,
  defaultPoster = "",
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string;
  defaultPoster?: string;
  hint?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { registerPending, clearPending } = useAdminUploadBusy();
  const [url, setUrl] = useState(defaultValue);
  const [poster, setPoster] = useState(defaultPoster);
  const [preview, setPreview] = useState(defaultValue);
  const [previewKind, setPreviewKind] = useState<"image" | "video">(isVideoSrc(defaultValue) ? "video" : "image");
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function assignFile(file: File) {
    const asImage = isImageFile(file);
    const asVideo = isVideoFile(file);
    if (!asImage && !asVideo) {
      setError("Use PNG, JPG, WEBP, MP4, MOV, or WEBM.");
      return;
    }
    if (asImage && file.size > IMAGE_MAX_BYTES) {
      setError("Image must be 5MB or smaller.");
      return;
    }
    if (asVideo && file.size > VIDEO_MAX_BYTES) {
      setError("Video must be 25MB or smaller.");
      return;
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setError("");
    setCleared(false);
    setPreviewKind(asVideo ? "video" : "image");
    setPreview((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });

    const body = new FormData();
    body.set("file", file);
    registerPending();
    startTransition(async () => {
      try {
        const result = await uploadAdminMediaAction(body);
        if (result.error || !result.url) {
          setError(result.error || "Upload failed.");
          setPreview((current) => {
            if (current.startsWith("blob:")) {
              URL.revokeObjectURL(current);
            }
            return url || defaultValue;
          });
          setPreviewKind(isVideoSrc(url || defaultValue) ? "video" : "image");
          return;
        }
        setUrl(result.url);
        setPoster(asVideo ? result.posterUrl ?? "" : "");
        markAdminFormDirty();
        setPreviewKind(asVideo ? "video" : "image");
        setPreview((current) => {
          if (current.startsWith("blob:")) {
            URL.revokeObjectURL(current);
          }
          return result.url!;
        });
      } finally {
        clearPending();
      }
    });
  }

  function clear() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setCleared(true);
    setUrl("");
    setPoster("");
    setError("");
    setPreviewKind("image");
    markAdminFormDirty();
    setPreview((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return "";
    });
  }

  const coverSrc = poster || (previewKind === "image" ? preview : "");

  return (
    <div className="admin-product-field">
      <label className="admin-product-label" htmlFor={inputId}>
        {label}
      </label>
      {hint ? <p className="admin-product-kicker">{hint}</p> : null}
      <input type="hidden" name={name} value={url} />
      <input type="hidden" name={`${name}Poster`} value={isVideoSrc(url) ? poster : ""} />
      <input type="hidden" name={`${name}Cleared`} value={cleared ? "1" : "0"} />
      <input
        id={inputId}
        ref={inputRef}
        className="admin-product-upload-input"
        type="file"
        accept={ACCEPT}
        onChange={(event) => {
          const next = event.target.files?.[0];
          if (next) {
            assignFile(next);
          }
        }}
      />
      <button
        type="button"
        className={`admin-storefront-stage${dragOver ? " is-over" : ""}${pending ? " is-uploading" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const dropped = event.dataTransfer.files[0];
          if (dropped) {
            assignFile(dropped);
          }
        }}
        aria-label={preview ? `Replace ${label}` : `Upload ${label}`}
        disabled={pending}
      >
        {preview ? (
          previewKind === "video" ? (
            <video
              src={preview}
              poster={poster || undefined}
              className="admin-storefront-preview-img"
              muted
              playsInline
              loop
              autoPlay
              controls={false}
            />
          ) : preview.startsWith("blob:") ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img src={preview} alt="" className="admin-storefront-preview-img" />
          ) : (
            <CmsImage src={coverSrc || preview} alt="" width={160} height={160} className="admin-storefront-preview-img" />
          )
        ) : (
          <span className="admin-storefront-preview--empty">
            {pending ? "Uploading…" : "Drop a photo or video here or click to upload"}
          </span>
        )}
      </button>
      <div className="admin-storefront-image-actions">
        <button type="button" className="admin-orders-open" onClick={() => inputRef.current?.click()} disabled={pending}>
          {pending ? "Uploading…" : preview ? "Replace" : "Upload"}
        </button>
        {preview ? (
          <button type="button" className="admin-product-delete" onClick={clear} disabled={pending}>
            Remove
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="admin-product-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="admin-product-kicker">
          {pending
            ? previewKind === "video"
              ? "Uploading video and building a cover frame…"
              : "Uploading media…"
            : "PNG/JPG/WEBP (5MB) or MP4/MOV/WEBM (25MB). Videos get an automatic cover. Publish when ready."}
        </p>
      )}
    </div>
  );
}
