import { randomBytes } from "node:crypto";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { AppError } from "@/lib/app-error";
import { getEnv } from "@/lib/env";
import { parseSchema } from "@/lib/parse-schema";
import type { RouteDefinition } from "@/server/http/load-routes";
import type { RequestContext } from "@/server/http/respond";
import { uploadDirectory } from "@/server/http/serve-upload";
import { HeroVideoError, prerenderHeroVideo } from "@/server/media/prerender-hero";
import { requirePermission } from "@/server/middleware/authorize";
import { authService } from "@/server/services/auth/auth.service";

export const definition: RouteDefinition = {
  method: "POST",
  path: "/admin/uploads/hero-video",
};

const VIDEO_MIME = new Map([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
  ["video/x-quicktime", "mov"],
]);

const bodySchema = z.union([
  z.object({
    mimeType: z.string().min(1),
    data: z.string().min(1),
  }),
  z.object({
    url: z.string().min(1),
  }),
]);

async function saveRawVideo(input: { mimeType: string; data: string }): Promise<string> {
  const env = getEnv();
  const ext = VIDEO_MIME.get(input.mimeType);
  if (!ext) {
    throw AppError.validation([{ field: "mimeType", message: "Expected a video mime type" }]);
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
  if (buffer.length > env.UPLOAD_MAX_FILE_SIZE) {
    throw AppError.payloadTooLarge();
  }
  const name = `hero-src-${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const directory = uploadDirectory();
  await mkdir(directory, { recursive: true });
  const target = path.join(directory, name);
  await writeFile(target, buffer);
  return target;
}

export async function handler(ctx: RequestContext) {
  await requirePermission(await authService.getUserFromSession(ctx.sessionToken), "MANAGE_CMS");
  const body = parseSchema(bodySchema, ctx.body);

  let inputPath: string;
  let savedHere = false;
  if ("url" in body) {
    const name = path.basename(body.url);
    if (!body.url.startsWith("/uploads/") || name !== body.url.slice("/uploads/".length).replace(/\\/g, "/")) {
      throw AppError.validation([{ field: "url", message: "Expected an /uploads/... path" }]);
    }
    inputPath = path.join(uploadDirectory(), name);
    try {
      await access(inputPath);
    } catch {
      throw AppError.notFound("Upload file not found");
    }
  } else {
    inputPath = await saveRawVideo(body);
    savedHere = true;
  }

  const basename = `hero-${Date.now()}-${randomBytes(4).toString("hex")}`;
  try {
    const result = await prerenderHeroVideo({ inputPath, outputDir: uploadDirectory(), basename });
    return { src: result.src, mobileSrc: result.mobileSrc, posterSrc: result.posterSrc };
  } catch (error) {
    if (error instanceof HeroVideoError) {
      throw AppError.unprocessable(error.message);
    }
    const name = error && typeof error === "object" && "name" in error ? String((error as { name?: unknown }).name) : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw AppError.unprocessable("Processing took too long. Try a shorter clip (under 8 seconds).");
    }
    const message = error instanceof Error ? error.message : "Hero video processing failed.";
    if (message.length > 0 && message.length < 180) {
      throw AppError.unprocessable(message);
    }
    if (message.length >= 180) {
      throw AppError.unprocessable(`${message.slice(0, 160)}…`);
    }
    throw AppError.unprocessable(
      "Hero video processing failed. Try a shorter clip on a plain beige/white backdrop.",
    );
  } finally {
    if (savedHere) {
      await rm(inputPath, { force: true });
    }
  }
}
