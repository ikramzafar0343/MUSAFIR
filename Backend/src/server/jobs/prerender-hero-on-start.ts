import { randomBytes } from "node:crypto";
import { access, writeFile } from "node:fs/promises";
import path from "node:path";

import { logger } from "@/lib/logger";
import { uploadDirectory } from "@/server/http/serve-upload";
import { HeroVideoError, isStackedAlphaVideoName, prerenderHeroVideo } from "@/server/media/prerender-hero";
import { storefrontService } from "@/server/services/storefront/storefront.service";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function uploadsBasename(src: string): string | null {
  if (!src.startsWith("/uploads/")) {
    return null;
  }
  const name = path.basename(src);
  if (!name || name.includes("..")) {
    return null;
  }
  return name;
}

/**
 * A hero published as a plain clip (uploaded before the cutout pipeline existed, or through
 * the generic media uploader) can't be drawn transparently. Convert it once in the
 * background and point the published storefront at the cutout.
 * PRERENDER_HERO_ON_START=0 turns this off.
 */
export async function prerenderHeroOnStartIfNeeded(): Promise<void> {
  if (process.env.PRERENDER_HERO_ON_START === "0") {
    return;
  }

  const storefront = await storefrontService.getFull();
  const heroSrc = String(storefront.content.heroVideoSrc ?? "").trim();
  const name = uploadsBasename(heroSrc);
  if (!name || isStackedAlphaVideoName(name)) {
    return;
  }

  const directory = uploadDirectory();
  const inputPath = path.join(directory, name);
  // Left behind when a clip can't be cut out, so every boot doesn't retry it.
  const failedMarker = path.join(directory, `.${name}.hero-failed`);
  if (!(await fileExists(inputPath)) || (await fileExists(failedMarker))) {
    return;
  }

  logger.info({ heroSrc }, "Converting the published hero clip to a transparent cutout");
  let result: Awaited<ReturnType<typeof prerenderHeroVideo>>;
  try {
    result = await prerenderHeroVideo({
      inputPath,
      outputDir: directory,
      basename: `hero-${Date.now()}-${randomBytes(4).toString("hex")}`,
    });
  } catch (error) {
    if (error instanceof HeroVideoError) {
      await writeFile(failedMarker, error.message).catch(() => undefined);
    }
    throw error;
  }

  const latest = await storefrontService.getFull();
  if (String(latest.content.heroVideoSrc ?? "").trim() !== heroSrc) {
    logger.info("Hero changed while converting; keeping the newer one");
    return;
  }
  await storefrontService.updatePublished(latest.commerce, latest.theme, {
    ...latest.content,
    heroVideoSrc: result.src,
    heroVideoMobileSrc: result.mobileSrc,
    heroVideoPosterSrc: result.posterSrc,
  });
  logger.info({ src: result.src, mobileSrc: result.mobileSrc }, "Published hero now uses the transparent cutout");
}
