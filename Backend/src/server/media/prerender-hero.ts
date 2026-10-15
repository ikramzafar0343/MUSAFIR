/**
 * Hero cutout: a clip of the subject on a plain backdrop becomes a looping stacked-alpha
 * H.264 pair (desktop + mobile) and a WebP poster of the loop's first frame.
 *
 * Stacked alpha: the top half of every frame is colour (straight, spread past the edges),
 * the bottom half the matte as grey. The storefront recombines the halves in a WebGL
 * shader, so every browser (iOS Safari included) plays it on the hardware decoder with no
 * per-frame CPU work.
 *
 * Pass 1 decodes a small copy of the clip to find the backdrop, the frames with the subject
 * fully in shot, the loop and the crop. Pass 2 mattes the frames the loop uses at working
 * size, then one ffmpeg encodes both sizes from the composed loop.
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { type FileHandle, mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import sharp from "sharp";

import { ffmpegBinary, ffprobeBinary, runMediaTool } from "@/server/media/ffmpeg-bin";
import { type FrameMix, type LoopPlan, planFrames, planSources } from "@/server/media/hero-loop";
import {
  combinePlates,
  computeMatte,
  createMatteBuffers,
  defaultMatteParams,
  estimatePlate,
  type MatteBox,
  type PlateEstimate,
} from "@/server/media/hero-matte";

/** Only the opening seconds of an upload are cut out / encoded. */
const ANALYSIS_SECONDS = 6;
const ANALYSIS_PIXELS = 40_000;
/** Desktop colour-half cap; stacked it stays inside H.264 level 4.2 (8704 macroblocks). */
const WORK_MAX_WIDTH = 1280;
const WORK_MAX_HEIGHT = 1080;
const WORK_MAX_PIXELS = 720_000;
const SD_SCALE = 0.75;
const HD_CRF = 23;
const SD_CRF = 25;
const MAX_FPS = 24;
/** Fade band, as a share of the frame width, where the subject leaves a side or the top. */
const EDGE_FEATHER = 0.03;
/** Colour is spread this many pixels past the silhouette (below this alpha it's rebuilt). */
const BLEED_RADIUS = 12;
const BLEED_MIN_ALPHA = 24;
/** Loop source frames above this size are kept in a temp file instead of memory. */
const MEMORY_FRAME_BUDGET = 192 * 1024 * 1024;
const JOB_TIMEOUT_MS = 150_000;
const OPAQUE_FALLBACK_TIMEOUT_MS = 60_000;

/** The storefront recognises stacked-alpha files by these suffixes. */
export const HERO_ALPHA_SUFFIX = {
  hd: "-alpha-hd.mp4",
  sd: "-alpha-sd.mp4",
  poster: "-alpha-poster.webp",
} as const;

export function isStackedAlphaVideoName(name: string): boolean {
  return /-alpha-(hd|sd)\.mp4$/i.test(name);
}

/** The clip can't be turned into a cutout; the message is meant for the admin. */
export class HeroVideoError extends Error {
  override name = "HeroVideoError";
}

export type PrerenderHeroInput = {
  inputPath: string;
  outputDir: string;
  basename: string;
  /** Defaults to outputDir. */
  posterDir?: string;
  signal?: AbortSignal;
};

export type PrerenderHeroResult = {
  src: string;
  mobileSrc: string;
  posterSrc: string;
  width: number;
  height: number;
  fps: number;
  frames: number;
  plan: LoopPlan;
};

type Size = { width: number; height: number };
type Rect = Size & { x: number; y: number };

type SourceInfo = Size & {
  fps: number;
  /** Frame rate handed to the encoder, as ffprobe reports it (keeps 24000/1001 exact). */
  rate: string;
  rateFilter: string | null;
  colorMatrix: string;
  colorRange: string;
};

type ProbeStream = {
  width?: number;
  height?: number;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  color_space?: string;
  color_range?: string;
  tags?: { rotate?: string };
  side_data_list?: Array<{ rotation?: number }>;
};

/** swscale names for the matrices ffprobe reports. */
const COLOR_MATRIX: Record<string, string> = {
  bt709: "bt709",
  smpte170m: "smpte170m",
  bt470bg: "bt470",
  bt2020nc: "bt2020",
  bt2020c: "bt2020",
  smpte240m: "smpte240m",
  fcc: "fcc",
};

let jobTail: Promise<unknown> = Promise.resolve();

/** One render at a time: each holds a few hundred MB and all cores for a while. */
function enqueueJob<T>(fn: () => Promise<T>): Promise<T> {
  const run = jobTail.then(fn, fn);
  jobTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function even(value: number): number {
  return Math.max(2, 2 * Math.round(value / 2));
}

function parseRate(value: string | undefined): number {
  const match = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(value?.trim() ?? "");
  const rate = match ? Number(match[1]) / Number(match[2]) : Number(value);
  return Number.isFinite(rate) && rate > 0 && rate < 1000 ? rate : 0;
}

async function probeSource(inputPath: string, signal: AbortSignal): Promise<SourceInfo> {
  const stdout = await runMediaTool(
    ffprobeBinary(),
    ["-v", "error", "-select_streams", "v:0", "-show_streams", "-of", "json", inputPath],
    { label: "ffprobe", signal, captureStdout: true },
  );
  let stream: ProbeStream | undefined;
  try {
    stream = (JSON.parse(stdout) as { streams?: ProbeStream[] }).streams?.[0];
  } catch {
    stream = undefined;
  }
  if (!stream?.width || !stream.height) {
    throw new HeroVideoError("That file has no readable video track.");
  }
  const rotation = Number(
    stream.side_data_list?.find((entry) => entry.rotation !== undefined)?.rotation ?? stream.tags?.rotate ?? 0,
  );
  const sideways = Math.abs(Math.round(rotation / 90)) % 2 === 1;
  const reported = parseRate(stream.avg_frame_rate) ? stream.avg_frame_rate : stream.r_frame_rate;
  const sourceFps = parseRate(reported) || 30;
  const capped = sourceFps > MAX_FPS + 0.5;
  return {
    width: sideways ? stream.height : stream.width,
    height: sideways ? stream.width : stream.height,
    fps: capped ? MAX_FPS : sourceFps,
    rate: capped ? String(MAX_FPS) : reported?.trim() || "30",
    rateFilter: capped ? `fps=${MAX_FPS}` : null,
    colorMatrix: COLOR_MATRIX[stream.color_space ?? ""] ?? "bt709",
    colorRange: stream.color_range === "pc" ? "pc" : "tv",
  };
}

function workingSize(source: Size): Size {
  const scale = Math.min(
    1,
    WORK_MAX_WIDTH / source.width,
    WORK_MAX_HEIGHT / source.height,
    Math.sqrt(WORK_MAX_PIXELS / (source.width * source.height)),
  );
  return { width: even(source.width * scale), height: even(source.height * scale) };
}

function analysisSize(work: Size): Size {
  const scale = Math.min(1, Math.sqrt(ANALYSIS_PIXELS / (work.width * work.height)));
  return { width: even(work.width * scale), height: even(work.height * scale) };
}

/** Decodes the opening of the clip as RGB frames of `size`, one Buffer per frame. */
async function* decodeFrames(inputPath: string, info: SourceInfo, size: Size, signal: AbortSignal): AsyncGenerator<Buffer> {
  const scale = [
    `scale=${size.width}:${size.height}`,
    "flags=lanczos+accurate_rnd+full_chroma_int",
    `in_color_matrix=${info.colorMatrix}`,
    `in_range=${info.colorRange}`,
  ].join(":");
  const filter = info.rateFilter ? `${info.rateFilter},${scale}` : scale;
  const args = [
    "-v", "error", "-nostdin", "-i", inputPath, "-t", String(ANALYSIS_SECONDS),
    "-map", "0:v:0", "-an", "-sn", "-dn", "-fps_mode", "passthrough",
    "-vf", filter, "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
  ];
  const child = spawn(ffmpegBinary(), args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], signal });
  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => {
    stderr = (stderr + chunk.toString("utf8")).slice(-4_000);
  });
  let spawnError: Error | null = null;
  const closed = new Promise<number | null>((resolve) => {
    child.once("error", (error) => {
      spawnError = error;
      resolve(null);
    });
    child.once("close", resolve);
  });

  const frameBytes = size.width * size.height * 3;
  let frame = Buffer.allocUnsafe(frameBytes);
  let filled = 0;
  let exited = false;
  try {
    for await (const chunk of child.stdout as AsyncIterable<Buffer>) {
      let offset = 0;
      while (offset < chunk.length) {
        const take = Math.min(frameBytes - filled, chunk.length - offset);
        chunk.copy(frame, filled, offset, offset + take);
        filled += take;
        offset += take;
        if (filled === frameBytes) {
          yield frame;
          frame = Buffer.allocUnsafe(frameBytes);
          filled = 0;
        }
      }
    }
    const code = await closed;
    exited = true;
    signal.throwIfAborted();
    if (code !== 0) {
      const reason = stderr.trim() || (spawnError as Error | null)?.message || "no stderr";
      throw new Error(`ffmpeg decode exited ${code}: ${reason}`);
    }
  } finally {
    if (!exited) {
      child.kill("SIGKILL");
    }
  }
}

type Encoder = {
  write(frame: Buffer): Promise<void>;
  finish(): Promise<void>;
  abort(): void;
};

function isBusyFileError(error: unknown): boolean {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
  return code === "EBUSY" || code === "EPERM" || code === "EACCES";
}

/** Windows often keeps ffmpeg output locked for a beat after the process exits. */
async function renameWhenFree(from: string, to: string, attempts = 20): Promise<void> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      await rename(from, to);
      return;
    } catch (error) {
      last = error;
      if (!isBusyFileError(error) || i === attempts - 1) {
        throw error;
      }
      await delay(100 + i * 80);
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

async function rmWhenFree(target: string, attempts = 16): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await rm(target, { force: true });
      return;
    } catch (error) {
      if (!isBusyFileError(error) || i === attempts - 1) {
        return;
      }
      await delay(80 + i * 60);
    }
  }
}

/** Clear leftover .part outputs for a basename so a fallback encode is not blocked by locks. */
async function clearHeroPartFiles(outputDir: string, posterDir: string, basename: string): Promise<void> {
  const targets = [
    path.join(outputDir, `${basename}${HERO_ALPHA_SUFFIX.hd}.part`),
    path.join(outputDir, `${basename}${HERO_ALPHA_SUFFIX.sd}.part`),
    path.join(posterDir, `${basename}${HERO_ALPHA_SUFFIX.poster}.part`),
    path.join(posterDir, `${basename}${HERO_ALPHA_SUFFIX.poster}.part.png`),
  ];
  await Promise.all(targets.map((target) => rmWhenFree(target)));
}

function abortError(signal: AbortSignal): Error {
  const reason = signal.reason;
  if (reason instanceof Error) {
    return reason;
  }
  const err = new Error(typeof reason === "string" && reason ? reason : "The operation was aborted");
  err.name = "AbortError";
  return err;
}

function startEncoder(args: readonly string[], signal: AbortSignal): Encoder {
  const child = spawn(ffmpegBinary(), [...args], { windowsHide: true, stdio: ["pipe", "ignore", "pipe"], signal });
  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => {
    stderr = (stderr + chunk.toString("utf8")).slice(-4_000);
  });
  const closed = new Promise<number | null>((resolve) => {
    child.once("error", () => resolve(null));
    child.once("close", resolve);
  });
  const failure = () => {
    if (signal.aborted) {
      return abortError(signal);
    }
    return new Error(`ffmpeg encode exited early: ${stderr.trim() || "no stderr"}`);
  };
  const stdin = child.stdin;
  stdin.on("error", () => undefined);
  return {
    async write(frame) {
      if (signal.aborted) {
        throw abortError(signal);
      }
      if (child.exitCode !== null || stdin.destroyed) {
        throw failure();
      }
      if (!stdin.write(frame)) {
        const early = closed.then(() => {
          throw failure();
        });
        early.catch(() => undefined);
        await Promise.race([once(stdin, "drain"), early]);
      }
    },
    async finish() {
      stdin.end();
      const code = await closed;
      if (signal.aborted) {
        throw abortError(signal);
      }
      if (code !== 0) {
        throw new Error(`ffmpeg encode exited ${code}: ${stderr.trim() || "no stderr"}`);
      }
    },
    abort() {
      child.kill("SIGKILL");
    },
  };
}

function encoderArgs(color: Size, sd: Size, rate: string, gop: number, hdPath: string, sdPath: string): string[] {
  // Mobile halves are scaled separately so the filter never mixes colour and matte rows.
  const graph = [
    "[0:v]split=3[hd][c][a]",
    `[c]crop=${color.width}:${color.height}:0:0,scale=${sd.width}:${sd.height}:flags=lanczos[sc]`,
    `[a]crop=${color.width}:${color.height}:0:${color.height},scale=${sd.width}:${sd.height}:flags=lanczos[sa]`,
    "[sc][sa]vstack=inputs=2[sd]",
    "[hd]scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[hdv]",
    "[sd]scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[sdv]",
  ].join(";");
  const encode = (crf: number) => [
    "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-crf", String(crf),
    "-g", String(gop), "-rc-lookahead", "20",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-movflags", "+faststart", "-an", "-f", "mp4",
  ];
  return [
    "-v", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${color.width}x${color.height * 2}`, "-r", rate, "-i", "pipe:0",
    "-filter_complex", graph,
    "-map", "[hdv]", ...encode(HD_CRF), hdPath,
    "-map", "[sdv]", ...encode(SD_CRF), sdPath,
  ];
}

function unionBox(a: MatteBox | null, b: MatteBox | null): MatteBox | null {
  if (!a || !b) {
    return a ?? b;
  }
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function evenSpan(start: number, end: number, limit: number): [number, number] {
  if ((end - start) % 2 === 0) {
    return [start, end];
  }
  if (end < limit) {
    return [start, end + 1];
  }
  return start > 0 ? [start - 1, end] : [start, end - 1];
}

/** Maps an analysis-frame box to a padded, even-sized crop of the working frame. */
function cropRect(box: MatteBox, from: Size, to: Size): Rect {
  const sx = to.width / from.width;
  const sy = to.height / from.height;
  const pad = Math.round(Math.max(to.width, to.height) * 0.02) + Math.ceil(Math.max(sx, sy));
  const [x0, x1] = evenSpan(
    Math.max(0, Math.floor(box.minX * sx) - pad),
    Math.min(to.width, Math.ceil((box.maxX + 1) * sx) + pad),
    to.width,
  );
  const [y0, y1] = evenSpan(
    Math.max(0, Math.floor(box.minY * sy) - pad),
    Math.min(to.height, Math.ceil((box.maxY + 1) * sy) + pad),
    to.height,
  );
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/**
 * Where the subject runs off the left, right or top of the source frame, fade it out over a
 * short band instead of ending on a hard straight cut. The bottom stays solid: it tucks
 * under the hero ribbon.
 */
function featherFrameEdges(alpha: Uint8Array, premul: Uint8Array, size: Size, requestedBand: number): void {
  const { width: w, height: h } = size;
  const band = Math.max(1, Math.min(requestedBand, Math.floor(w / 4), Math.floor(h / 4)));
  const fade = (distance: number) => {
    const t = Math.min(1, (distance + 0.5) / band);
    return t * t * (3 - 2 * t);
  };
  const apply = (p: number, factor: number) => {
    const a = alpha[p] ?? 0;
    if (factor >= 1 || a === 0) return;
    alpha[p] = Math.round(a * factor);
    const i = p * 3;
    premul[i] = Math.round((premul[i] ?? 0) * factor);
    premul[i + 1] = Math.round((premul[i + 1] ?? 0) * factor);
    premul[i + 2] = Math.round((premul[i + 2] ?? 0) * factor);
  };
  for (let y = 0; y < h; y += 1) {
    const row = y * w;
    if (y < band) {
      const top = fade(y);
      for (let x = 0; x < w; x += 1) {
        apply(row + x, Math.min(top, fade(x), fade(w - 1 - x)));
      }
      continue;
    }
    for (let x = 0; x < band; x += 1) {
      const factor = fade(x);
      apply(row + x, factor);
      apply(row + w - 1 - x, factor);
    }
  }
}

/** Crop → stacked frame: premultiplied colour on top, matte as grey below. */
function stackFrame(premul: Uint8Array, alpha: Uint8Array, stride: number, crop: Rect): Buffer {
  const rowBytes = crop.width * 3;
  const out = Buffer.allocUnsafe(rowBytes * crop.height * 2);
  const half = rowBytes * crop.height;
  for (let y = 0; y < crop.height; y += 1) {
    const rowStart = (crop.y + y) * stride + crop.x;
    out.set(premul.subarray(rowStart * 3, rowStart * 3 + rowBytes), y * rowBytes);
    let o = half + y * rowBytes;
    for (let x = 0; x < crop.width; x += 1) {
      const a = alpha[rowStart + x] ?? 0;
      out[o] = a;
      out[o + 1] = a;
      out[o + 2] = a;
      o += 3;
    }
  }
  return out;
}

/** The loop's matted source frames, in memory or (when large) in a temp file. */
class FrameStore {
  private readonly memory = new Map<number, Buffer>();
  private readonly offsets = new Map<number, number>();
  private recent: Array<{ index: number; frame: Buffer }> = [];
  private file: FileHandle | null = null;
  private filePath: string | null = null;
  private size = 0;

  constructor(
    private readonly frameBytes: number,
    private readonly onDisk: boolean,
  ) {}

  async put(index: number, frame: Buffer): Promise<void> {
    if (!this.onDisk) {
      this.memory.set(index, frame);
      return;
    }
    if (!this.file) {
      this.filePath = path.join(os.tmpdir(), `musafir-hero-${process.pid}-${randomBytes(4).toString("hex")}.raw`);
      this.file = await open(this.filePath, "w+");
    }
    await this.file.write(frame, 0, frame.length, this.size);
    this.offsets.set(index, this.size);
    this.size += frame.length;
  }

  async get(index: number): Promise<Buffer> {
    const held = this.memory.get(index) ?? this.recent.find((entry) => entry.index === index)?.frame;
    if (held) {
      return held;
    }
    const offset = this.offsets.get(index);
    if (offset === undefined || !this.file) {
      throw new Error(`Hero source frame ${index} was not rendered`);
    }
    const frame = Buffer.allocUnsafe(this.frameBytes);
    await this.file.read(frame, 0, this.frameBytes, offset);
    this.recent = [{ index, frame }, ...this.recent].slice(0, 3);
    return frame;
  }

  async dispose(): Promise<void> {
    await this.file?.close();
    if (this.filePath) {
      await rm(this.filePath, { force: true });
    }
  }
}

/** Weighted mix of stacked frames. Linear mixing is exact for premultiplied colour + matte. */
async function composeFrame(mix: FrameMix, store: FrameStore): Promise<Buffer> {
  const [head, second] = mix;
  if (!head) {
    throw new Error("Empty hero loop frame");
  }
  const a = await store.get(head.source);
  if (!second) {
    return a;
  }
  const b = await store.get(second.source);
  const out = Buffer.allocUnsafe(a.length);
  const wa = head.weight;
  const wb = second.weight;
  for (let i = 0; i < a.length; i += 1) {
    out[i] = Math.round((a[i] ?? 0) * wa + (b[i] ?? 0) * wb);
  }
  return out;
}

type BleedScratch = { known: Uint8Array; queue: Int32Array };

/**
 * Premultiplied stacked frame in, encoder frame out. The colour half is un-premultiplied
 * and spread a few pixels past the silhouette: the two halves are compressed separately,
 * so their edges blur differently, and a colour half that drops to black at the edge would
 * come back as a dark or bright rim once the player recombines them.
 */
function toEncodedFrame(stacked: Buffer, size: Size, scratch: BleedScratch): Buffer {
  const { width: w, height: h } = size;
  const n = w * h;
  const half = n * 3;
  const { known, queue } = scratch;
  const out = Buffer.allocUnsafe(stacked.length);
  stacked.copy(out, half, half);

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let solid = 0;
  for (let p = 0; p < n; p += 1) {
    const a = stacked[half + p * 3] ?? 0;
    const i = p * 3;
    if (a < BLEED_MIN_ALPHA) {
      known[p] = 0;
      continue;
    }
    const unmix = 255 / a;
    const r = Math.min(255, Math.round((stacked[i] ?? 0) * unmix));
    const g = Math.min(255, Math.round((stacked[i + 1] ?? 0) * unmix));
    const b = Math.min(255, Math.round((stacked[i + 2] ?? 0) * unmix));
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    known[p] = 1;
    sumR += r;
    sumG += g;
    sumB += b;
    solid += 1;
  }

  let tail = 0;
  const isUnknown = (q: number) => known[q] === 0;
  for (let p = 0; p < n; p += 1) {
    if (known[p] !== 1) continue;
    const x = p % w;
    if ((x > 0 && isUnknown(p - 1)) || (x < w - 1 && isUnknown(p + 1)) || (p >= w && isUnknown(p - w)) || (p < n - w && isUnknown(p + w))) {
      queue[tail++] = p;
    }
  }
  let head = 0;
  for (let layer = 0; layer < BLEED_RADIUS && head < tail; layer += 1) {
    const layerEnd = tail;
    for (; head < layerEnd; head += 1) {
      const p = queue[head] ?? 0;
      const x = p % w;
      const claim = (q: number) => {
        if (known[q] === 0) {
          known[q] = 2;
          queue[tail++] = q;
        }
      };
      if (x > 0) claim(p - 1);
      if (x < w - 1) claim(p + 1);
      if (p >= w) claim(p - w);
      if (p < n - w) claim(p + w);
    }
    for (let k = layerEnd; k < tail; k += 1) {
      const q = queue[k] ?? 0;
      const x = q % w;
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      const take = (s: number) => {
        if (known[s] !== 1) return;
        r += out[s * 3] ?? 0;
        g += out[s * 3 + 1] ?? 0;
        b += out[s * 3 + 2] ?? 0;
        count += 1;
      };
      if (x > 0) take(q - 1);
      if (x < w - 1) take(q + 1);
      if (q >= w) take(q - w);
      if (q < n - w) take(q + w);
      const i = q * 3;
      out[i] = Math.round(r / Math.max(1, count));
      out[i + 1] = Math.round(g / Math.max(1, count));
      out[i + 2] = Math.round(b / Math.max(1, count));
    }
    for (let k = layerEnd; k < tail; k += 1) {
      known[queue[k] ?? 0] = 1;
    }
  }

  const fillR = solid > 0 ? Math.round(sumR / solid) : 0;
  const fillG = solid > 0 ? Math.round(sumG / solid) : 0;
  const fillB = solid > 0 ? Math.round(sumB / solid) : 0;
  for (let p = 0; p < n; p += 1) {
    if (known[p] !== 0) continue;
    const i = p * 3;
    out[i] = fillR;
    out[i + 1] = fillG;
    out[i + 2] = fillB;
  }
  return out;
}

async function posterWebp(encoded: Buffer, size: Size): Promise<Buffer> {
  const pixels = size.width * size.height;
  const half = pixels * 3;
  const rgba = Buffer.alloc(pixels * 4);
  for (let p = 0; p < pixels; p += 1) {
    const i = p * 3;
    const o = p * 4;
    rgba[o] = encoded[i] ?? 0;
    rgba[o + 1] = encoded[i + 1] ?? 0;
    rgba[o + 2] = encoded[i + 2] ?? 0;
    rgba[o + 3] = encoded[half + i] ?? 0;
  }
  return sharp(rgba, { raw: { width: size.width, height: size.height, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toBuffer();
}

function publicUrlFor(dir: string, filename: string, kind: "video" | "poster"): string {
  const normalized = path.resolve(dir).replace(/\\/g, "/").toLowerCase();
  if (normalized.includes("/uploads")) {
    return `/uploads/${filename}`;
  }
  return kind === "poster" ? `/assets/images/${filename}` : `/assets/videos/${filename}`;
}

async function prerenderOnce(input: PrerenderHeroInput, signal: AbortSignal): Promise<PrerenderHeroResult> {
  const info = await probeSource(input.inputPath, signal);
  const work = workingSize(info);
  const low = analysisSize(work);

  const lowFrames: Buffer[] = [];
  for await (const frame of decodeFrames(input.inputPath, info, low, signal)) {
    lowFrames.push(frame);
  }
  if (lowFrames.length < Math.max(24, Math.round(info.fps * 2))) {
    throw new HeroVideoError("The hero clip is too short. Use at least 2 seconds of footage.");
  }

  const estimates = lowFrames
    .map((frame) => estimatePlate(frame, low.width, low.height))
    .filter((estimate): estimate is PlateEstimate => estimate !== null);
  // Accept as soon as a solid minority of frames agree — real clips flicker under auto-exposure.
  const plateFloor = Math.max(4, Math.floor(lowFrames.length * 0.18));
  const plate = estimates.length >= plateFloor ? combinePlates(estimates) : null;
  if (!plate) {
    throw new HeroVideoError(
      "The hero clip needs a plain, evenly lit background (a white studio backdrop works best).",
    );
  }

  const lowParams = defaultMatteParams(low.width, low.height, plate);
  const lowBuffers = createMatteBuffers(low.width, low.height);
  const lowAlpha = new Uint8Array(low.width * low.height);
  const lowPremul = new Uint8Array(low.width * low.height * 3);
  const boxes: Array<MatteBox | null> = [];
  for (const frame of lowFrames) {
    const stats = computeMatte(frame, plate, lowParams, lowBuffers, lowAlpha, lowPremul);
    boxes.push(stats.box);
  }
  const frameCount = lowFrames.length;
  lowFrames.length = 0;

  // Full-clip transparent matte: every analyzed frame is cut out (no loop trim).
  const plan: LoopPlan = { kind: "cut", start: 0, end: frameCount, crossfade: 0 };
  const sources = planSources(plan);
  const mixes = planFrames(plan);

  let union: MatteBox | null = null;
  for (let k = sources.first; k <= sources.last; k += 1) {
    union = unionBox(union, boxes[k] ?? null);
  }
  if (!union) {
    throw new HeroVideoError("Couldn't find a subject in the hero clip.");
  }
  const crop = cropRect(union, low, work);
  const sdHeight = even(crop.height * SD_SCALE);
  const sd = { width: even((crop.width * sdHeight) / crop.height), height: sdHeight };

  const posterDir = input.posterDir ?? input.outputDir;
  await mkdir(input.outputDir, { recursive: true });
  await mkdir(posterDir, { recursive: true });
  const names = {
    hd: `${input.basename}${HERO_ALPHA_SUFFIX.hd}`,
    sd: `${input.basename}${HERO_ALPHA_SUFFIX.sd}`,
    poster: `${input.basename}${HERO_ALPHA_SUFFIX.poster}`,
  };
  const finalPaths = {
    hd: path.join(input.outputDir, names.hd),
    sd: path.join(input.outputDir, names.sd),
    poster: path.join(posterDir, names.poster),
  };
  const partPaths = {
    hd: `${finalPaths.hd}.part`,
    sd: `${finalPaths.sd}.part`,
    poster: `${finalPaths.poster}.part`,
  };

  const frameBytes = crop.width * crop.height * 6;
  const store = new FrameStore(frameBytes, (sources.last - sources.first + 1) * frameBytes > MEMORY_FRAME_BUDGET);
  let encoder: Encoder | null = null;
  try {
    const params = defaultMatteParams(work.width, work.height, plate);
    const buffers = createMatteBuffers(work.width, work.height);
    const alpha = new Uint8Array(work.width * work.height);
    const premul = new Uint8Array(work.width * work.height * 3);
    const featherBand = Math.round(work.width * EDGE_FEATHER);
    let index = 0;
    for await (const frame of decodeFrames(input.inputPath, info, work, signal)) {
      const k = index;
      index += 1;
      if (k < sources.first) {
        continue;
      }
      computeMatte(frame, plate, params, buffers, alpha, premul);
      featherFrameEdges(alpha, premul, work, featherBand);
      await store.put(k, stackFrame(premul, alpha, work.width, crop));
      if (k >= sources.last) {
        break;
      }
    }
    if (index <= sources.last) {
      throw new Error(`Hero clip ended at frame ${index}, before loop frame ${sources.last}`);
    }

    const scratch = { known: new Uint8Array(crop.width * crop.height), queue: new Int32Array(crop.width * crop.height) };
    encoder = startEncoder(encoderArgs(crop, sd, info.rate, mixes.length, partPaths.hd, partPaths.sd), signal);
    let poster: Buffer | null = null;
    for (const mix of mixes) {
      const encoded = toEncodedFrame(await composeFrame(mix, store), crop, scratch);
      poster ??= encoded;
      await encoder.write(encoded);
    }
    await encoder.finish();
    encoder = null;
    // Let Windows release ffmpeg handles before renaming .part → final.
    await delay(150);
    if (!poster) {
      throw new Error("Hero loop has no frames");
    }
    await writeFile(partPaths.poster, await posterWebp(poster, crop));

    await renameWhenFree(partPaths.hd, finalPaths.hd);
    await renameWhenFree(partPaths.sd, finalPaths.sd);
    await renameWhenFree(partPaths.poster, finalPaths.poster);
  } catch (error) {
    encoder?.abort();
    await delay(100);
    await Promise.all(Object.values(partPaths).map((part) => rmWhenFree(part)));
    throw error;
  } finally {
    await store.dispose();
  }

  return {
    src: publicUrlFor(input.outputDir, names.hd, "video"),
    mobileSrc: publicUrlFor(input.outputDir, names.sd, "video"),
    posterSrc: publicUrlFor(posterDir, names.poster, "poster"),
    width: crop.width,
    height: crop.height,
    fps: info.fps,
    frames: mixes.length,
    plan,
  };
}

/**
 * Fast path for clips that cannot be keyed (busy rooms, fashion footage, etc.):
 * wrap the video as stacked-alpha with a solid opaque matte so the storefront player
 * still accepts it. The subject is not cut out — the frame plays as a rectangle.
 */
async function prerenderOpaqueHero(input: PrerenderHeroInput, signal: AbortSignal): Promise<PrerenderHeroResult> {
  const info = await probeSource(input.inputPath, signal);
  const work = workingSize(info);
  const sdHeight = even(work.height * SD_SCALE);
  const sd = { width: even((work.width * sdHeight) / work.height), height: sdHeight };
  const posterDir = input.posterDir ?? input.outputDir;
  await mkdir(input.outputDir, { recursive: true });
  await mkdir(posterDir, { recursive: true });

  const names = {
    hd: `${input.basename}${HERO_ALPHA_SUFFIX.hd}`,
    sd: `${input.basename}${HERO_ALPHA_SUFFIX.sd}`,
    poster: `${input.basename}${HERO_ALPHA_SUFFIX.poster}`,
  };
  const finalPaths = {
    hd: path.join(input.outputDir, names.hd),
    sd: path.join(input.outputDir, names.sd),
    poster: path.join(posterDir, names.poster),
  };
  // Distinct temp names (must end in .mp4/.webp — ffmpeg refuses bare ".part" mux targets).
  const stamp = randomBytes(4).toString("hex");
  const partPaths = {
    hd: path.join(input.outputDir, `${input.basename}.fb-${stamp}-hd.tmp.mp4`),
    sd: path.join(input.outputDir, `${input.basename}.fb-${stamp}-sd.tmp.mp4`),
    poster: path.join(posterDir, `${input.basename}.fb-${stamp}-poster.tmp.webp`),
  };

  const fps = Math.min(info.fps, MAX_FPS);
  const graph = [
    `[0:v]fps=${fps},scale=${work.width}:${work.height}:flags=lanczos,format=yuv420p,setsar=1,split=2[c][m]`,
    `[m]geq=lum=255:cb=128:cr=128[a]`,
    `[c][a]vstack=inputs=2,split=2[hd][sdin]`,
    `[sdin]scale=${sd.width}:${sd.height * 2}:flags=lanczos[sd]`,
  ].join(";");

  try {
    await runMediaTool(
      ffmpegBinary(),
      [
        "-y", "-v", "error", "-nostdin",
        "-i", input.inputPath,
        "-t", String(ANALYSIS_SECONDS),
        "-an", "-sn", "-dn",
        "-filter_complex", graph,
        "-map", "[hd]",
        "-c:v", "libx264", "-preset", "veryfast", "-profile:v", "high", "-crf", String(HD_CRF),
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-f", "mp4",
        partPaths.hd,
        "-map", "[sd]",
        "-c:v", "libx264", "-preset", "veryfast", "-profile:v", "high", "-crf", String(SD_CRF),
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-f", "mp4",
        partPaths.sd,
      ],
      { label: "hero-opaque-encode", signal },
    );

    const posterPng = `${partPaths.poster}.png`;
    await runMediaTool(
      ffmpegBinary(),
      [
        "-y", "-v", "error", "-nostdin",
        "-i", partPaths.hd,
        "-vframes", "1",
        "-vf", `crop=${work.width}:${work.height}:0:0`,
        posterPng,
      ],
      { label: "hero-opaque-poster", signal },
    );
    try {
      const buf = await readFile(posterPng);
      await writeFile(partPaths.poster, await sharp(buf).webp({ quality: 86, effort: 4 }).toBuffer());
    } finally {
      await rmWhenFree(posterPng);
    }

    await delay(150);
    await clearHeroPartFiles(input.outputDir, posterDir, input.basename);
    await renameWhenFree(partPaths.hd, finalPaths.hd);
    await renameWhenFree(partPaths.sd, finalPaths.sd);
    await renameWhenFree(partPaths.poster, finalPaths.poster);
  } catch (error) {
    await delay(80);
    await Promise.all(Object.values(partPaths).map((part) => rmWhenFree(part)));
    await rmWhenFree(`${partPaths.poster}.png`);
    throw error;
  }

  return {
    src: publicUrlFor(input.outputDir, names.hd, "video"),
    mobileSrc: publicUrlFor(input.outputDir, names.sd, "video"),
    posterSrc: publicUrlFor(posterDir, names.poster, "poster"),
    width: work.width,
    height: work.height,
    fps,
    frames: Math.max(1, Math.round(fps * ANALYSIS_SECONDS)),
    plan: { kind: "cut", start: 0, end: Math.max(1, Math.round(fps * ANALYSIS_SECONDS)), crossfade: 0 },
  };
}

/**
 * Renders the stacked-alpha hero set. Tries a studio cutout first; if the clip cannot be
 * keyed (timeout, encode crash, busy BG), falls back to an opaque stacked wrap.
 */
export function prerenderHeroVideo(input: PrerenderHeroInput): Promise<PrerenderHeroResult> {
  return enqueueJob(async () => {
    const cutoutSignal = input.signal
      ? AbortSignal.any([input.signal, AbortSignal.timeout(JOB_TIMEOUT_MS)])
      : AbortSignal.timeout(JOB_TIMEOUT_MS);
    try {
      return await prerenderOnce(input, cutoutSignal);
    } catch (error) {
      // Caller cancelled — do not invent a fallback render.
      if (input.signal?.aborted) {
        throw error;
      }
      const detail = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console -- operator-visible fallback during long cutout jobs
      console.warn(`[hero] cutout failed, using opaque wrap: ${detail}`);
      const posterDir = input.posterDir ?? input.outputDir;
      // Give Windows time to release aborted-ffmpeg locks, then clear leftover .parts.
      await delay(500);
      await clearHeroPartFiles(input.outputDir, posterDir, input.basename);
      const fallbackSignal = input.signal
        ? AbortSignal.any([input.signal, AbortSignal.timeout(OPAQUE_FALLBACK_TIMEOUT_MS)])
        : AbortSignal.timeout(OPAQUE_FALLBACK_TIMEOUT_MS);
      try {
        return await prerenderOpaqueHero(input, fallbackSignal);
      } catch (fallbackError) {
        const fallbackDetail = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        // eslint-disable-next-line no-console -- operator-visible fallback during long cutout jobs
        console.warn(`[hero] opaque wrap failed: ${fallbackDetail}`);
        throw fallbackError;
      }
    }
  });
}
