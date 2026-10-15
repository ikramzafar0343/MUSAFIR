"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { removeBackgroundAction } from "@/features/admin/background-remover/actions";
import { UploadZone } from "@/features/admin/background-remover/upload-zone";

type Stage = "empty" | "selected" | "processing" | "success" | "error";
type Backdrop = "checker" | "white" | "dark";

type SourceMeta = {
  file: File;
  url: string;
  width: number;
  height: number;
};

type ResultMeta = {
  url: string;
  width: number;
  height: number;
  provider: string;
  downloadName: string;
};

function sanitizeDownloadName(original: string): string {
  const base = original.replace(/\.[^.]+$/, "").replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `${base || "cutout"}-transparent.png`;
}

function readImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = url;
  });
}

export function BackgroundRemoverPage() {
  const [stage, setStage] = useState<Stage>("empty");
  const [source, setSource] = useState<SourceMeta | null>(null);
  const [result, setResult] = useState<ResultMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backdrop, setBackdrop] = useState<Backdrop>("checker");
  const [pending, startTransition] = useTransition();
  const flightRef = useRef(false);

  useEffect(() => {
    return () => {
      if (source?.url) {
        URL.revokeObjectURL(source.url);
      }
      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [source?.url, result?.url]);

  async function onFile(file: File) {
    if (flightRef.current || pending) {
      return;
    }
    if (source?.url) {
      URL.revokeObjectURL(source.url);
    }
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }
    setResult(null);
    setError(null);

    const url = URL.createObjectURL(file);
    try {
      const size = await readImageSize(url);
      setSource({ file, url, width: size.width, height: size.height });
      setStage("selected");
    } catch {
      URL.revokeObjectURL(url);
      setSource(null);
      setStage("error");
      setError("Could not read that image. Try another file.");
    }
  }

  function reset() {
    if (flightRef.current) {
      return;
    }
    if (source?.url) {
      URL.revokeObjectURL(source.url);
    }
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }
    setSource(null);
    setResult(null);
    setError(null);
    setStage("empty");
  }

  function process() {
    if (!source || flightRef.current || pending) {
      return;
    }
    flightRef.current = true;
    setStage("processing");
    setError(null);

    const formData = new FormData();
    formData.set("file", source.file);

    startTransition(async () => {
      try {
        const response = await removeBackgroundAction(formData);
        if (!response.ok) {
          setStage("error");
          setError(response.message);
          return;
        }
        const bytes = Uint8Array.from(atob(response.data.pngBase64), (char) => char.charCodeAt(0));
        const blob = new Blob([bytes], { type: "image/png" });
        if (result?.url) {
          URL.revokeObjectURL(result.url);
        }
        setResult({
          url: URL.createObjectURL(blob),
          width: response.data.width,
          height: response.data.height,
          provider: response.data.provider,
          downloadName: sanitizeDownloadName(source.file.name),
        });
        setStage("success");
      } catch (err) {
        setStage("error");
        setError(err instanceof Error ? err.message : "Background removal failed");
      } finally {
        flightRef.current = false;
      }
    });
  }

  const busy = pending || stage === "processing";

  return (
    <div className="admin-product-page admin-bg-remover">
      <header className="admin-product-toolbar">
        <div className="admin-product-toolbar-copy">
          <h1 className="admin-product-title">Background remover</h1>
          <p className="admin-product-sku">
            Local cutout for product photos · real transparent PNG · no API key
          </p>
        </div>
        <div className="admin-product-toolbar-actions">
          {source ? (
            <button type="button" className="admin-product-ghost" disabled={busy} onClick={reset}>
              Clear
            </button>
          ) : null}
          {source && stage !== "success" ? (
            <button type="button" className="admin-product-cta" disabled={busy} onClick={process}>
              {busy ? "Processing…" : "Remove background"}
            </button>
          ) : null}
          {result ? (
            <a className="admin-product-cta" href={result.url} download={result.downloadName}>
              Download PNG
            </a>
          ) : null}
        </div>
      </header>

      {stage === "empty" ? <UploadZone disabled={busy} onFile={onFile} /> : null}

      {source ? (
        <div className="admin-bg-compare">
          <figure className="admin-bg-panel">
            <figcaption className="admin-bg-panel-label">
              Original · {source.width}×{source.height}
            </figcaption>
            <div className="admin-bg-preview admin-bg-preview--plain">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={source.url} alt="Original upload" />
            </div>
          </figure>

          <figure className="admin-bg-panel">
            <figcaption className="admin-bg-panel-label">
              {result
                ? `Cutout · ${result.width}×${result.height} · ${result.provider}`
                : busy
                  ? "Cutout · processing…"
                  : "Cutout · waiting"}
            </figcaption>
            <div className={`admin-bg-preview admin-bg-preview--${backdrop}`}>
              {result ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.url} alt="Transparent cutout" />
              ) : (
                <p className="admin-bg-preview-empty">
                  {busy ? "Running local model…" : "Run remove background to preview"}
                </p>
              )}
            </div>
            {result ? (
              <div className="admin-bg-backdrop-switch" role="group" aria-label="Preview backdrop">
                {(
                  [
                    ["checker", "Checker"],
                    ["white", "White"],
                    ["dark", "Dark"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`admin-product-ghost${backdrop === id ? " is-active" : ""}`}
                    aria-pressed={backdrop === id}
                    onClick={() => setBackdrop(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </figure>
        </div>
      ) : null}

      {error ? (
        <p className="admin-product-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
