import sharp from "sharp";

import { AppError } from "@/lib/app-error";
import { logger } from "@/lib/logger";
import type {
  BackgroundRemovalProvider,
  BackgroundRemovalResult,
} from "@/server/services/tools/background-removal.types";
import { LocalImgLyProvider } from "@/server/services/tools/local-imgly.provider";

/** Hard cap for local model memory safety (plan). */
export const BG_REMOVAL_HARD_MAX_BYTES = 12 * 1024 * 1024;
/** ~25 megapixels — conservative for ONNX on typical admin hosts. */
export const BG_REMOVAL_MAX_MEGAPIXELS = 25;
export const BG_REMOVAL_TIMEOUT_MS = 90_000;

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);

export type BackgroundRemovalRequest = {
  readonly mimeType: string;
  readonly data: string;
};

function maxInputBytes(): number {
  const configured = Number(process.env.UPLOAD_MAX_FILE_SIZE);
  const uploadMax =
    Number.isFinite(configured) && configured > 0 ? configured : BG_REMOVAL_HARD_MAX_BYTES;
  return Math.min(uploadMax, BG_REMOVAL_HARD_MAX_BYTES);
}

export class BackgroundRemovalService {
  constructor(private readonly provider: BackgroundRemovalProvider = new LocalImgLyProvider()) {}

  async remove(input: BackgroundRemovalRequest): Promise<{
    pngBase64: string;
    width: number;
    height: number;
    provider: string;
  }> {
    const started = Date.now();
    const maxBytes = maxInputBytes();

    if (!ALLOWED_MIME.has(input.mimeType)) {
      throw AppError.validation([{ field: "mimeType", message: "Unsupported image type (png, jpeg, webp, avif)" }]);
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(input.data, "base64");
    } catch {
      throw AppError.validation([{ field: "data", message: "Invalid file payload" }]);
    }
    if (buffer.length < 1) {
      throw AppError.validation([{ field: "data", message: "Empty file" }]);
    }
    if (buffer.length > maxBytes) {
      throw AppError.payloadTooLarge();
    }

    try {
      const meta = await sharp(buffer, { failOn: "none" }).metadata();
      if (!meta.width || !meta.height) {
        throw new Error("missing dimensions");
      }
      const megapixels = (meta.width * meta.height) / 1_000_000;
      if (megapixels > BG_REMOVAL_MAX_MEGAPIXELS) {
        throw AppError.validation([
          {
            field: "data",
            message: `Image too large (${megapixels.toFixed(1)}MP). Max ${BG_REMOVAL_MAX_MEGAPIXELS}MP.`,
          },
        ]);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.validation([{ field: "data", message: "Invalid or corrupt image" }]);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), BG_REMOVAL_TIMEOUT_MS);
    let result: BackgroundRemovalResult;
    try {
      result = await this.provider.removeBackground(
        { buffer, mimeType: input.mimeType },
        controller.signal,
      );
    } catch (error) {
      logger.warn(
        {
          provider: this.provider.id,
          ms: Date.now() - started,
          err: error instanceof Error ? error.message : String(error),
        },
        "Background removal failed",
      );
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.unprocessable(
        error instanceof Error ? error.message : "Background removal failed",
      );
    } finally {
      clearTimeout(timer);
    }

    await assertHonestCutout(result.png);

    logger.info(
      {
        provider: result.provider,
        width: result.width,
        height: result.height,
        ms: Date.now() - started,
        status: "ok",
      },
      "Background removal completed",
    );

    return {
      pngBase64: result.png.toString("base64"),
      width: result.width,
      height: result.height,
      provider: result.provider,
    };
  }
}

async function assertHonestCutout(png: Buffer): Promise<void> {
  try {
    const meta = await sharp(png).metadata();
    if (meta.format !== "png" || !meta.width || !meta.height) {
      throw AppError.unprocessable("Background removal returned an invalid PNG");
    }
    if (meta.channels !== undefined && meta.channels < 4 && meta.hasAlpha !== true) {
      throw AppError.unprocessable("Background removal did not produce an alpha channel");
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.unprocessable("Background removal returned an undecodable PNG");
  }

  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let transparent = 0;
  const stride = info.channels;
  for (let i = stride - 1; i < data.length; i += stride) {
    if (data[i]! < 255) {
      transparent += 1;
      if (transparent > 16) {
        return;
      }
    }
  }
  throw AppError.unprocessable(
    "Background removal produced a flat opaque image — try a clearer subject/background contrast",
  );
}

export const backgroundRemovalService = new BackgroundRemovalService();
