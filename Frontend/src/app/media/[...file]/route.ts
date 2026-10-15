import { createReadStream, existsSync } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function resolveUploadRoots(): string[] {
  const roots: string[] = [];
  const envDir = process.env.UPLOAD_DIR?.trim();
  if (envDir) {
    roots.push(path.resolve(envDir));
  }
  // Local Next: often Frontend/public/uploads
  roots.push(path.join(process.cwd(), "public", "uploads"));
  // Monorepo: Backend/uploads or repo-level uploads next to Frontend
  roots.push(path.join(process.cwd(), "..", "uploads"));
  roots.push(path.join(process.cwd(), "..", "Backend", "uploads"));
  return [...new Set(roots)];
}

function safeBasename(segments: string[]): string | null {
  if (segments.length !== 1) {
    return null;
  }
  const raw = segments[0] ?? "";
  const name = path.basename(raw);
  if (!name || name !== raw || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return null;
  }
  return name;
}

async function findUploadFile(name: string): Promise<string | null> {
  for (const root of resolveUploadRoots()) {
    const target = path.join(root, name);
    const normalizedRoot = path.resolve(root) + path.sep;
    const normalizedTarget = path.resolve(target);
    if (!normalizedTarget.startsWith(normalizedRoot) && normalizedTarget !== path.resolve(root)) {
      continue;
    }
    try {
      if (!existsSync(normalizedTarget)) {
        continue;
      }
      await access(normalizedTarget);
      const info = await stat(normalizedTarget);
      if (info.isFile()) {
        return normalizedTarget;
      }
    } catch {
      /* try next root */
    }
  }
  return null;
}

type RouteContext = {
  params: Promise<{ file: string[] }>;
};

/**
 * Serves upload files for Next `/_next/image?url=/media/...` optimization.
 * Validates a single basename — no path traversal.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { file } = await context.params;
  const name = safeBasename(file ?? []);
  if (!name) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const target = await findUploadFile(name);
  if (!target) {
    return new NextResponse("Not found", { status: 404 });
  }

  const info = await stat(target);
  const ext = path.extname(name).toLowerCase();
  const type = MIME[ext] ?? "application/octet-stream";
  const stream = Readable.toWeb(createReadStream(target)) as ReadableStream;

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": type,
      "Content-Length": String(info.size),
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
