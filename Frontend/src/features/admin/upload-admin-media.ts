"use server";

import { redirect } from "next/navigation";

import { ADMIN_ROLES } from "@/constants/roles";
import { saveHeroVideoUpload, saveUploadMedia } from "@/lib/api/uploads";
import { getSessionUser } from "@/lib/session";

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 25 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-quicktime"]);

function resolveKind(file: File): "image" | "video" | null {
  if (IMAGE_TYPES.has(file.type)) {
    return "image";
  }
  if (VIDEO_TYPES.has(file.type)) {
    return "video";
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp")) {
    return "image";
  }
  if (name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov")) {
    return "video";
  }
  return null;
}

/** Upload a storefront tile/media file immediately so Publish can save a stable URL. */
export async function uploadAdminMediaAction(
  formData: FormData,
): Promise<{ url?: string; posterUrl?: string; error?: string }> {
  try {
    const user = await getSessionUser();
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      redirect("/admin/login");
    }
    const file = formData.get("file");
    if (!(file instanceof File) || file.size < 1) {
      return { error: "Choose a file first." };
    }
    const kind = resolveKind(file);
    if (!kind) {
      return { error: "Use PNG, JPG, WEBP, MP4, MOV, or WEBM." };
    }
    if (kind === "image" && file.size > IMAGE_MAX_BYTES) {
      return { error: "Image must be 5MB or smaller." };
    }
    if (kind === "video" && file.size > VIDEO_MAX_BYTES) {
      return { error: "Video must be 25MB or smaller." };
    }
    // Images run studio auto-cutout on the API (professional matte + defringe).
    const result = await saveUploadMedia(file);
    if (!result?.url) {
      return { error: kind === "video" ? "Video upload failed." : "Upload failed. Try a smaller PNG, JPG, or WEBP." };
    }
    return result.posterUrl
      ? { url: result.url, posterUrl: result.posterUrl }
      : { url: result.url };
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) {
      throw error;
    }
    return { error: error instanceof Error ? error.message : "Upload failed" };
  }
}

/** Upload the homepage hero clip; the API cuts it out and renders the looping stacked-alpha set. */
export async function uploadAdminHeroVideoAction(
  formData: FormData,
): Promise<{ src?: string; mobileSrc?: string; posterSrc?: string; error?: string }> {
  try {
    const user = await getSessionUser();
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      redirect("/admin/login");
    }
    const file = formData.get("file");
    if (!(file instanceof File) || file.size < 1) {
      return { error: "Choose a video file first." };
    }
    if (resolveKind(file) !== "video") {
      return { error: "Use MP4, MOV, or WEBM." };
    }
    if (file.size > VIDEO_MAX_BYTES) {
      return { error: "Video must be 25MB or smaller." };
    }
    const result = await saveHeroVideoUpload(file);
    if (!result?.src) {
      return { error: "Hero video processing failed." };
    }
    return {
      src: result.src,
      mobileSrc: result.mobileSrc,
      posterSrc: result.posterSrc,
    };
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) {
      throw error;
    }
    return { error: error instanceof Error ? error.message : "Hero video upload failed" };
  }
}
