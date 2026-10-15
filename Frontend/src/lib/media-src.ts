/** True when a storefront media path points at a video file. */
export function isVideoSrc(src: string): boolean {
  const path = String(src ?? "").trim().split(/[?#]/)[0]?.toLowerCase() ?? "";
  return path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".mov");
}
