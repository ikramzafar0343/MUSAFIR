/**
 * Lightweight Backend unit tests (no DB required).
 * Run: npm test --prefix Backend
 */
import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Parse a single Range header into { start, end } or null. */
function parseBytesRange(header, size) {
  if (!header || !header.startsWith("bytes=")) return null;
  const spec = header.slice(6).trim();
  if (spec.includes(",")) return null;
  const [rawStart, rawEnd] = spec.split("-");
  let start;
  let end;
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

function testParseBytesRange() {
  assert.deepEqual(parseBytesRange("bytes=0-9", 100), { start: 0, end: 9 });
  assert.deepEqual(parseBytesRange("bytes=50-", 100), { start: 50, end: 99 });
  assert.deepEqual(parseBytesRange("bytes=-20", 100), { start: 80, end: 99 });
  assert.equal(parseBytesRange("bytes=200-300", 100), null);
  assert.equal(parseBytesRange("bytes=10-5", 100), null);
  assert.equal(parseBytesRange(undefined, 100), null);
  console.log("ok parseBytesRange");
}

async function testRangeServeSketch() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "musafir-range-"));
  const file = path.join(dir, "clip.mp4");
  const body = Buffer.from("0123456789ABCDEFGHIJ");
  await writeFile(file, body);

  const server = createServer(async (req, res) => {
    const size = body.length;
    const range = parseBytesRange(req.headers.range, size);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", "video/mp4");
    if (!range) {
      if (req.headers.range) {
        res.writeHead(416, { "Content-Range": `bytes */${size}` });
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Length": String(size) });
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      await pipeline(createReadStream(file), res);
      return;
    }
    const { start, end } = range;
    res.writeHead(206, {
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${size}`,
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    await pipeline(createReadStream(file, { start, end }), res);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  const full = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(full.status, 200);
  assert.equal(await full.text(), body.toString());

  const partial = await fetch(`http://127.0.0.1:${port}/`, {
    headers: { Range: "bytes=0-9" },
  });
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get("content-range"), "bytes 0-9/20");
  assert.equal(await partial.text(), "0123456789");

  const bad = await fetch(`http://127.0.0.1:${port}/`, {
    headers: { Range: "bytes=99-100" },
  });
  assert.equal(bad.status, 416);

  server.close();
  await rm(dir, { recursive: true, force: true });
  console.log("ok rangeServeSketch");
}

testParseBytesRange();
await testRangeServeSketch();
console.log(`Backend tests passed (${root})`);

export { parseBytesRange };
