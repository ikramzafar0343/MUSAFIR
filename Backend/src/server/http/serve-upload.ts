import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import { getEnv } from "@/lib/env";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

/** Absolute directory where admin uploads are stored. */
export function uploadDirectory(): string {
  const env = getEnv();
  return path.resolve(process.cwd(), env.UPLOAD_DIR);
}

/** Parse a single Range header into { start, end } or null (unsatisfiable / invalid). */
export function parseBytesRange(header: string | undefined, size: number): { start: number; end: number } | null {
  if (!header || !header.startsWith("bytes=")) return null;
  const spec = header.slice(6).trim();
  if (spec.includes(",")) return null;
  const [rawStart, rawEnd] = spec.split("-");
  let start: number;
  let end: number;
  if (rawStart === "") {
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" || rawEnd === undefined ? size - 1 : Number(rawEnd);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) {
    return null;
  }
  end = Math.min(end, size - 1);
  return { start, end };
}

function weakEtag(size: number, mtimeMs: number): string {
  const digest = createHash("sha1").update(`${size}-${mtimeMs}`).digest("hex").slice(0, 16);
  return `W/"${digest}"`;
}

/**
 * Serves GET /uploads/<file> from UPLOAD_DIR.
 * Supports Range / 206 / 416, ETag, Last-Modified, and 304.
 * Returns true when the request was handled (including 404/405).
 */
export async function tryServeUpload(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  if (!pathname.startsWith("/uploads/")) {
    return false;
  }

  const method = req.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return true;
  }

  const rawName = decodeURIComponent(pathname.slice("/uploads/".length));
  const name = path.basename(rawName);
  if (!name || name !== rawName.replace(/\\/g, "/") || name.includes("..")) {
    res.writeHead(400);
    res.end("Bad request");
    return true;
  }

  const directory = uploadDirectory();
  const target = path.join(directory, name);
  if (!target.startsWith(directory + path.sep) && target !== directory) {
    res.writeHead(400);
    res.end("Bad request");
    return true;
  }

  let info;
  try {
    await access(target);
    info = await stat(target);
    if (!info.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return true;
    }
  } catch {
    res.writeHead(404);
    res.end("Not found");
    return true;
  }

  const size = info.size;
  const etag = weakEtag(size, info.mtimeMs);
  const lastModified = info.mtime.toUTCString();
  const ext = path.extname(name).toLowerCase();
  const type = MIME[ext] ?? "application/octet-stream";

  const ifNoneMatch = req.headers["if-none-match"];
  if (ifNoneMatch && ifNoneMatch === etag) {
    res.writeHead(304, {
      ETag: etag,
      "Last-Modified": lastModified,
      "Cache-Control": "public, max-age=604800, immutable",
      "Accept-Ranges": "bytes",
    });
    res.end();
    return true;
  }

  const ifModifiedSince = req.headers["if-modified-since"];
  if (ifModifiedSince && !ifNoneMatch) {
    const since = Date.parse(ifModifiedSince);
    if (Number.isFinite(since) && info.mtimeMs <= since + 1000) {
      res.writeHead(304, {
        ETag: etag,
        "Last-Modified": lastModified,
        "Cache-Control": "public, max-age=604800, immutable",
        "Accept-Ranges": "bytes",
      });
      res.end();
      return true;
    }
  }

  const rangeHeader = typeof req.headers.range === "string" ? req.headers.range : undefined;
  const range = parseBytesRange(rangeHeader, size);

  const common = {
    "Content-Type": type,
    "Cache-Control": "public, max-age=604800, immutable",
    "Accept-Ranges": "bytes",
    ETag: etag,
    "Last-Modified": lastModified,
  } as const;

  if (rangeHeader && !range) {
    res.writeHead(416, {
      ...common,
      "Content-Range": `bytes */${size}`,
    });
    res.end();
    return true;
  }

  if (!range) {
    res.writeHead(200, {
      ...common,
      "Content-Length": String(size),
    });
    if (method === "HEAD") {
      res.end();
      return true;
    }
    await pipeline(createReadStream(target), res);
    return true;
  }

  const { start, end } = range;
  res.writeHead(206, {
    ...common,
    "Content-Length": String(end - start + 1),
    "Content-Range": `bytes ${start}-${end}/${size}`,
  });
  if (method === "HEAD") {
    res.end();
    return true;
  }
  await pipeline(createReadStream(target, { start, end }), res);
  return true;
}
