import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/assets/images");
const FILES = [
  "premium_saddle.jpg",
  "leather_bridle.jpg",
  "premium_halter.jpg",
  "leather_care.jpg",
];

function isBackdrop(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (r + g + b) / 3;
  return (sat < 0.08 && lum > 232) || (sat < 0.05 && lum > 245);
}

async function cutout(file) {
  const input = path.join(DIR, file);
  const outName = file.replace(/\.jpe?g$/i, ".png");
  const output = path.join(DIR, outName);

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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

  const soft = new Uint8Array(w * h);
  for (let i = 0; i < soft.length; i++) soft[i] = alpha[i] === 0 ? 0 : 255;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = idx(x, y);
      if (alpha[i] === 0) continue;
      const o = i * channels;
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const lum = (r + g + b) / 3;
      if (!(sat < 0.12 && lum > 210)) continue;
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
      if (touch) soft[i] = Math.max(0, Math.round(255 * ((250 - lum) / 40)));
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
  if (maxX < 0) throw new Error(`No opaque pixels in ${file}`);

  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.06);
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

  await sharp(canvas, { raw: { width: side, height: side, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(output);

  console.log(`${file} -> ${outName} (${side}x${side})`);
}

for (const file of FILES) {
  await cutout(file);
}
