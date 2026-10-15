import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/assets/images");

const SOURCE = process.argv[2];
const OUT_NAME = process.argv[3] || "western_floral_bridle.png";

if (!SOURCE || !fs.existsSync(SOURCE)) {
  throw new Error(`Source image required. Got: ${SOURCE}`);
}

function isBackdrop(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (r + g + b) / 3;
  return lum < 28 || (sat < 0.18 && lum < 42);
}

const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h, channels } = info;
const alpha = new Uint8Array(w * h).fill(255);
const seen = new Uint8Array(w * h);
const queue = new Int32Array(w * h);
let qh = 0;
let qt = 0;

const idx = (x, y) => y * w + x;
const push = (x, y) => {
  const i = idx(x, y);
  if (seen[i]) return;
  const o = i * channels;
  if (!isBackdrop(data[o], data[o + 1], data[o + 2])) return;
  seen[i] = 1;
  queue[qt++] = i;
};

for (let x = 0; x < w; x++) {
  push(x, 0);
  push(x, h - 1);
}
for (let y = 0; y < h; y++) {
  push(0, y);
  push(w - 1, y);
}

while (qh < qt) {
  const i = queue[qh++];
  const x = i % w;
  const y = (i / w) | 0;
  alpha[i] = 0;
  if (x > 0) push(x - 1, y);
  if (x + 1 < w) push(x + 1, y);
  if (y > 0) push(x, y - 1);
  if (y + 1 < h) push(x, y + 1);
}

const soft = new Uint8Array(alpha);
for (let y = 1; y < h - 1; y++) {
  for (let x = 1; x < w - 1; x++) {
    const i = idx(x, y);
    if (alpha[i] === 0) continue;
    const o = i * channels;
    const lum = (data[o] + data[o + 1] + data[o + 2]) / 3;
    if (lum > 48) continue;
    let touch = false;
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      if (alpha[idx(x + dx, y + dy)] === 0) {
        touch = true;
        break;
      }
    }
    if (touch) soft[i] = Math.max(0, Math.round(255 * (lum / 48)));
  }
}

const rgba = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) {
  const o = i * channels;
  const d = i * 4;
  rgba[d] = data[o];
  rgba[d + 1] = data[o + 1];
  rgba[d + 2] = data[o + 2];
  rgba[d + 3] = soft[i];
}

let minX = w;
let minY = h;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    if (soft[idx(x, y)] < 16) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
}
if (maxX < 0) throw new Error("No opaque pixels after cutout");

const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.05);
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(w - 1, maxX + pad);
maxY = Math.min(h - 1, maxY + pad);
const cw = maxX - minX + 1;
const ch = maxY - minY + 1;
const side = Math.max(cw, ch);
const canvas = Buffer.alloc(side * side * 4, 0);
const ox = Math.floor((side - cw) / 2);
const oy = Math.floor((side - ch) / 2);

for (let y = 0; y < ch; y++) {
  for (let x = 0; x < cw; x++) {
    const s = ((minY + y) * w + (minX + x)) * 4;
    const t = ((oy + y) * side + (ox + x)) * 4;
    canvas[t] = rgba[s];
    canvas[t + 1] = rgba[s + 1];
    canvas[t + 2] = rgba[s + 2];
    canvas[t + 3] = rgba[s + 3];
  }
}

const output = path.join(OUT_DIR, OUT_NAME);
await sharp(canvas, { raw: { width: side, height: side, channels: 4 } })
  .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(`Wrote ${output}`);
