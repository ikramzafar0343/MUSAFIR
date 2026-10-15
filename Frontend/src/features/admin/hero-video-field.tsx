"use client";

import { useId, useRef, useState, useTransition } from "react";

import { markAdminFormDirty } from "@/features/admin/unsaved-guard";
import { uploadAdminHeroVideoAction } from "@/features/admin/upload-admin-media";
import { useAdminUploadBusy } from "@/features/admin/upload-busy";
import { CmsImage } from "@/features/media/cms-image";
import { useStackedAlphaPlayer } from "@/features/media/stacked-alpha-player";
import { type HeroVideoSet, isStackedAlphaVideoSrc, resolveHeroVideoSet } from "@/lib/hero-video";

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT = "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";

const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-quicktime"]);

function isAllowed(file: File) {
  if (ALLOWED_TYPES.has(file.type)) {
    return true;
  }
  const name = file.name.toLowerCase();
  return name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov");
}

/** The cutout as the storefront shows it, on the hero's olive backdrop. */
function HeroCutoutPreview({ hero }: { hero: HeroVideoSet }) {
  const stageRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useStackedAlphaPlayer({ src: hero.mobileSrc }, { video: videoRef, canvas: canvasRef, viewport: stageRef });

  return (
    <span ref={stageRef} className="admin-hero-preview">
      <CmsImage
        src={hero.posterSrc}
        alt=""
        fill
        sizes="9rem"
        className={`admin-hero-preview-poster${live ? " is-hidden" : ""}`}
      />
      <video ref={videoRef} className="admin-hero-preview-source" muted playsInline loop preload="auto" aria-hidden="true" />
      <canvas ref={canvasRef} className={`admin-hero-preview-canvas${live ? " is-live" : ""}`} aria-hidden="true" />
    </span>
  );
}

/** Homepage hero: upload → background removal + seamless loop → desktop / mobile / poster URLs. */
export function HeroVideoField({
  label,
  defaultSrc,
  defaultMobileSrc,
  defaultPosterSrc,
  hint,
}: {
  label: string;
  defaultSrc: string;
  defaultMobileSrc: string;
  defaultPosterSrc: string;
  hint?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { registerPending, clearPending } = useAdminUploadBusy();
  const [src, setSrc] = useState(defaultSrc);
  const [mobileSrc, setMobileSrc] = useState(defaultMobileSrc);
  const [posterSrc, setPosterSrc] = useState(defaultPosterSrc);
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const shown = resolveHeroVideoSet({ src, mobileSrc, posterSrc });
  const awaitingConversion = Boolean(src) && !isStackedAlphaVideoSrc(src);

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

    const body = new FormData();
    body.set("file", file);
    registerPending();
    startTransition(async () => {
      try {
        const result = await uploadAdminHeroVideoAction(body);
        if (result.error || !result.src || !result.mobileSrc || !result.posterSrc) {
          setError(result.error || "Hero video processing failed.");
          return;
        }
        setCleared(false);
        setSrc(result.src);
        setMobileSrc(result.mobileSrc);
        setPosterSrc(result.posterSrc);
        markAdminFormDirty();
      } finally {
        clearPending();
      }
    });
  }

  function resetToDefault() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setCleared(true);
    setSrc("");
    setMobileSrc("");
    setPosterSrc("");
    setError("");
    markAdminFormDirty();
  }

  return (
    <div className="admin-product-field admin-product-field--full">
      <label className="admin-product-label" htmlFor={inputId}>
        {label}
      </label>
      {hint ? <p className="admin-product-kicker">{hint}</p> : null}
      <input type="hidden" name="heroVideoSrc" value={src} />
      <input type="hidden" name="heroVideoMobileSrc" value={mobileSrc} />
      <input type="hidden" name="heroVideoPosterSrc" value={posterSrc} />
      <input type="hidden" name="heroVideoSrcCleared" value={cleared ? "1" : "0"} />
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
        aria-label={`Replace ${label}`}
        disabled={pending}
      >
        {pending ? (
          <span className="admin-storefront-preview--empty">Processing…</span>
        ) : (
          <HeroCutoutPreview key={shown.src} hero={shown} />
        )}
      </button>
      <div className="admin-storefront-image-actions">
        <button type="button" className="admin-orders-open" onClick={() => inputRef.current?.click()} disabled={pending}>
          {pending ? "Processing…" : "Replace"}
        </button>
        {src ? (
          <button type="button" className="admin-product-delete" onClick={resetToDefault} disabled={pending}>
            Use default
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
            ? "Removing the background and building the loop… this can take up to a minute."
            : awaitingConversion
              ? "This clip hasn't been cut out yet, so the default hero is showing. Upload it again to convert it now."
              : !src
                ? "Showing the default hero. Upload a clip to replace it."
                : "MP4, MOV, or WEBM, 2–10 seconds, up to 25MB. Publish after processing to update the live hero."}
        </p>
      )}
    </div>
  );
}
