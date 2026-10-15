import { apiRequest } from "@/lib/api/client";

export type BackgroundRemovalResult = {
  pngBase64: string;
  width: number;
  height: number;
  provider: string;
};

function resolveMimeType(file: File): string {
  if (file.type) {
    return file.type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) {
    return "image/png";
  }
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (name.endsWith(".webp")) {
    return "image/webp";
  }
  if (name.endsWith(".avif")) {
    return "image/avif";
  }
  return "application/octet-stream";
}

/** Local ML cutout — returns RGBA PNG as base64 (no remove.bg key). */
export async function removeBackground(file: File): Promise<BackgroundRemovalResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return apiRequest<BackgroundRemovalResult>(
    "POST",
    "/admin/tools/background-removal",
    {
      mimeType: resolveMimeType(file),
      data: buffer.toString("base64"),
    },
    {},
    // Local ONNX can take up to ~90s (plus first-run model download).
    { timeoutMs: 120_000 },
  );
}
