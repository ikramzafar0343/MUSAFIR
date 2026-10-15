import { rm } from "node:fs/promises";

import sharp from "sharp";

import { ffmpegBinary, runMediaTool } from "@/server/media/ffmpeg-bin";

/** Re-encode an arbitrary video upload to H.264 ≤1080p, no audio, faststart + poster. */
export async function transcodeUploadVideo(inputPath: string, outputMp4Path: string, posterPath: string): Promise<void> {
  await runMediaTool(
    ffmpegBinary(),
    [
      "-y",
      "-i",
      inputPath,
      "-an",
      "-vf",
      "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "23",
      "-preset",
      "medium",
      "-movflags",
      "+faststart",
      outputMp4Path,
    ],
    { label: "ffmpeg transcode" },
  );

  const tmpJpg = `${posterPath}.tmp.jpg`;
  try {
    await runMediaTool(
      ffmpegBinary(),
      ["-y", "-ss", "0", "-i", outputMp4Path, "-frames:v", "1", "-q:v", "2", tmpJpg],
      { label: "ffmpeg poster" },
    );
    if (posterPath.endsWith(".webp")) {
      await sharp(tmpJpg).webp({ quality: 82 }).toFile(posterPath);
    } else {
      await sharp(tmpJpg).jpeg({ quality: 85 }).toFile(posterPath);
    }
  } finally {
    await rm(tmpJpg, { force: true });
  }
}
