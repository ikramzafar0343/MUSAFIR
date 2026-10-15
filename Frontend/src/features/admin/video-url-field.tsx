"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import { markAdminFormDirty } from "@/features/admin/unsaved-guard";
import { uploadAdminMediaAction } from "@/features/admin/upload-admin-media";
import { useAdminUploadBusy } from "@/features/admin/upload-busy";

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT = "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";

const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-quicktime"]);

function isAllowed(file: File) {
  if (ALLOWED_TYPES.has(file.type)) {
    return true;
  }
  // Some browsers leave type empty for .mov — fall back to extension
  const name = file.name.toLowerCase();
  return name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov");
}

/** Generic video URL field (upload-on-select). Prefer HeroVideoField for the homepage hero. */
export function VideoUrlField({
  name,
  label,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string;
  hint?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { registerPending, clearPending } = useAdminUploadBusy();
  const [url, setUrl] = useState(defaultValue);
  const [preview, setPreview] = useState(defaultValue);
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
    if (!isAllowed(file)) {
      setError("Use MP4, MOV, or WEBM.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Video must be 25MB or smaller.");
      return;
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setError("");
    setCleared(false);
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
          return;
        }
        setUrl(result.url);
        markAdminFormDirty();
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
    setError("");
    markAdminFormDirty();
    setPreview((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return "";
    });
  }

  return (
    <div className="admin-product-field admin-product-field--full">
      <label className="admin-product-label" htmlFor={inputId}>
        {label}
      </label>
      {hint ? <p className="admin-product-kicker">{hint}</p> : null}
      <input type="hidden" name={name} value={url} />
      <input type="hidden" name={`${name}Cleared`} value={cleared ? "1" : "0"} />
      <input
        id={inputId}
        ref={inputRef}
        className="admin-product-upload-input"
        type="file"
        accept={ACCEPT}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            assignFile(file);
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
          const file = event.dataTransfer.files[0];
          if (file) {
            assignFile(file);
          }
        }}
        aria-label={preview ? `Replace ${label}` : `Upload ${label}`}
        disabled={pending}
      >
        {preview ? (
          <video src={preview} className="admin-storefront-preview-img" muted playsInline loop autoPlay controls={false} />
        ) : (
          <span className="admin-storefront-preview--empty">
            {pending ? "Uploading…" : "Drop an MP4 or MOV here or click to upload"}
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
            ? "Uploading video…"
            : "MP4, MOV, or WEBM. Up to 25MB. Wait for upload, then Publish to update the live shop."}
        </p>
      )}
    </div>
  );
}
