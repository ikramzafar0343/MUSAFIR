import { execFileSync, spawn } from "node:child_process";

import ffmpegStatic from "ffmpeg-static";
import { path as ffprobePath } from "ffprobe-static";

const resolvedBinaries = new Map<string, string | undefined>();

function whichBinary(name: string): string | undefined {
  if (resolvedBinaries.has(name)) {
    return resolvedBinaries.get(name);
  }
  let found: string | undefined;
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    const out = execFileSync(cmd, [name], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    found = out.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || undefined;
  } catch {
    found = undefined;
  }
  resolvedBinaries.set(name, found);
  return found;
}

/** Prefer apt/system ffmpeg in Docker; fall back to npm ffmpeg-static. */
export function ffmpegBinary(): string {
  const system = whichBinary("ffmpeg");
  if (system) {
    return system;
  }
  if (!ffmpegStatic) {
    throw new Error("ffmpeg binary not found (system PATH or ffmpeg-static)");
  }
  return ffmpegStatic;
}

/** Prefer system ffprobe; fall back to npm ffprobe-static. */
export function ffprobeBinary(): string {
  const system = whichBinary("ffprobe");
  if (system) {
    return system;
  }
  if (!ffprobePath) {
    throw new Error("ffprobe binary not found (system PATH or ffprobe-static)");
  }
  return ffprobePath;
}

export type MediaToolOptions = {
  label: string;
  signal?: AbortSignal;
  captureStdout?: boolean;
};

/** Runs ffmpeg/ffprobe to completion. Resolves with stdout (when captured). */
export function runMediaTool(bin: string, args: readonly string[], options: MediaToolOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, [...args], {
      windowsHide: true,
      stdio: ["ignore", options.captureStdout ? "pipe" : "ignore", "pipe"],
      ...(options.signal ? { signal: options.signal } : {}),
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString("utf8")).slice(-8_000);
    });
    child.on("error", (error) => {
      if (options.signal?.aborted) {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        reject(err);
        return;
      }
      reject(error);
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      if (options.signal?.aborted) {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        reject(err);
        return;
      }
      reject(new Error(`${options.label} exited ${code}: ${stderr.trim() || "no stderr"}`));
    });
  });
}
