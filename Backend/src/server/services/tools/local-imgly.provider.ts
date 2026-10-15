import sharp from "sharp";

import { AppError } from "@/lib/app-error";
import { logger } from "@/lib/logger";
import type {
  BackgroundRemovalInput,
  BackgroundRemovalProvider,
  BackgroundRemovalResult,
} from "@/server/services/tools/background-removal.types";

const PROVIDER_ID = "local-imgly";

/**
 * Local ONNX segmentation via @imgly/background-removal-node.
 * First run may download model weights; no third-party API key.
 */
export class LocalImgLyProvider implements BackgroundRemovalProvider {
  readonly id = PROVIDER_ID;

  async removeBackground(input: BackgroundRemovalInput, signal?: AbortSignal): Promise<BackgroundRemovalResult> {
    if (signal?.aborted) {
      throw AppError.unprocessable("Background removal timed out");
    }

    const removeBackground = await loadRemoveBackground();
    const blob = await Promise.race([
      removeBackground(input.buffer, {
        output: { format: "image/png", quality: 1 },
      }),
      abortRace(signal),
    ]);

    const arrayBuffer = await blob.arrayBuffer();
    const png = Buffer.from(arrayBuffer);
    const meta = await sharp(png).metadata();
    if (!meta.width || !meta.height) {
      throw AppError.unprocessable("Background removal returned an invalid image");
    }

    return {
      png,
      width: meta.width,
      height: meta.height,
      provider: PROVIDER_ID,
    };
  }
}

type RemoveBackgroundFn = (
  image: Buffer,
  config?: { output?: { format?: string; quality?: number } },
) => Promise<Blob>;

let cachedRemove: RemoveBackgroundFn | undefined;

async function loadRemoveBackground(): Promise<RemoveBackgroundFn> {
  if (cachedRemove) {
    return cachedRemove;
  }
  try {
    const mod = (await import("@imgly/background-removal-node")) as {
      removeBackground: RemoveBackgroundFn;
    };
    cachedRemove = mod.removeBackground;
    return cachedRemove;
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : String(error) },
      "Failed to load @imgly/background-removal-node",
    );
    throw AppError.unprocessable(
      "Local background-removal model is not available. Ensure @imgly/background-removal-node is installed.",
    );
  }
}

function abortRace(signal?: AbortSignal): Promise<never> {
  return new Promise((_resolve, reject) => {
    if (!signal) {
      return;
    }
    const onAbort = () => {
      reject(AppError.unprocessable("Background removal timed out"));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
