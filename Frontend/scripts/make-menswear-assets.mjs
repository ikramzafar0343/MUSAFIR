/**
 * Import shared menswear studio photos, cut white/cream backdrops to alpha
 * (including under-arm pockets), and write square transparent PNG + WebP assets.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/assets/images");
const SRC_DIR =
  process.env.MUSAFIR_PHOTO_SRC || path.join(ROOT, "tmp-photos");

/** Short id → source filename fragment (unique suffix or timestamp token). */
const MAP = {
  "coats-blazers": "03_29_27_AM-5-e6b9feb4",
  shirts: "03_29_30_AM-1-58e70722",
  trousers: "03_29_23_AM-4-6735c5f7",
  shoes: "03_30_12_AM-5-cec07cd3",
  "matching-pairs": "03_29_17_AM-1-0337285a",
  "new-arrivals": "03_29_36_AM-4-5c6fc17e",
  hero: "03_29_27_AM-5-e6b9feb4",
  "story-primary": "02_31_46_AM-127d80e4",
  "story-secondary": "03_29_32_AM-2-d003da8b",
  "story-portrait": "03_29_47_AM-1-484f9805",
  "auth-login": "03_29_49_AM-2-d0f70359",
  "auth-register": "03_30_03_AM-2-55c816e2",
  about: "03_30_10_AM-4-e8c26193",
  contact: "03_29_55_AM-4-37c23e97",
  faq: "03_29_38_AM-5-dd359bb1",
  glow: "03_29_58_AM-6-c603aee3",
  highlights: "03_29_21_AM-3-f2b1c4ed",
  "float-a": "03_29_53_AM-3-dc3cf616",
  "float-b": "03_29_40_AM-6-a5d53342",
  "float-c": "03_30_07_AM-3-34d361a5",
  "float-d": "03_29_57_AM-5-ae15fd72",
  "float-e": "03_30_16_AM-6-6ac8e9fa",
  collection: "03_29_18_AM-2-8fe6437e",
};

const HORSE_GLOBS = [
  "western_floral_*.png",
  "premium_saddle.*",
  "premium_halter.*",
  "leather_bridle.*",
  "leather_care.*",
  "saddle_hero.*",
  "saddlera_*",
  "hourse_shoe.*",
  "hero-horse-*",
  "oak-rein-*",
];

function isBackdrop(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (r + g + b) / 3;
  // Studio white / soft grey sweep behind mannequins.
  return (sat < 0.1 && lum > 218) || (sat < 0.06 && lum > 235) || (r > 235 && g > 235 && b > 235);
}

async function findSource(token) {
  const files = await fs.readdir(SRC_DIR);
  const hit = files.find((name) => name.includes(token) && /\.jpe?g$/i.test(name));
  if (!hit) {
    throw new Error(`No source photo for token ${token} in ${SRC_DIR}`);
  }
  return path.join(SRC_DIR, hit);
}

async function cutoutToSquare(inputPath, outBase) {
  const { data, info } = await sharp(inputPath)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  const alpha = new Uint8Array(w * h).fill(255);
  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qh = 0;
  let qt = 0;

  const idx = (x, y) => y * w + x;
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
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
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  // Clear enclosed studio pockets (under arms) that did not touch the border.
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || alpha[i] === 0) continue;
    const o = i * channels;
    if (!isBackdrop(data[o], data[o + 1], data[o + 2])) continue;
    // Seed a pocket flood only for bright plate pixels still opaque.
    const seedQ = [i];
    seen[i] = 1;
    const region = [i];
    let touchesSubject = false;
    while (seedQ.length) {
      const cur = seedQ.pop();
      const x = cur % w;
      const y = (cur / w) | 0;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = idx(nx, ny);
        if (seen[ni]) continue;
        const no = ni * channels;
        if (isBackdrop(data[no], data[no + 1], data[no + 2])) {
          seen[ni] = 1;
          seedQ.push(ni);
          region.push(ni);
        } else {
          touchesSubject = true;
        }
      }
    }
    if (touchesSubject && region.length < w * h * 0.08) {
      for (const ri of region) alpha[ri] = 0;
    }
  }

  const soft = new Uint8Array(w * h);
  for (let i = 0; i < soft.length; i++) soft[i] = alpha[i] === 0 ? 0 : 255;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = idx(x, y);
      if (soft[i] === 0) continue;
      const o = i * channels;
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const lum = (r + g + b) / 3;
      if (!(sat < 0.14 && lum > 200)) continue;
      let touch = false;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        if (soft[idx(x + dx, y + dy)] === 0) {
          touch = true;
          break;
        }
      }
      if (touch) soft[i] = Math.max(0, Math.round(255 * ((248 - lum) / 48)));
    }
  }

  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const o = i * channels;
    const d = i * 4;
    const a = soft[i];
    rgba[d] = data[o];
    rgba[d + 1] = data[o + 1];
    rgba[d + 2] = data[o + 2];
    rgba[d + 3] = a;
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
  if (maxX < 0) throw new Error(`No opaque pixels in ${inputPath}`);

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

  const pngPath = path.join(OUT_DIR, `${outBase}.png`);
  const webpPath = path.join(OUT_DIR, `${outBase}.webp`);
  const jpgPath = path.join(OUT_DIR, `${outBase}.jpg`);

  await sharp(canvas, { raw: { width: side, height: side, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(pngPath);

  await sharp(canvas, { raw: { width: side, height: side, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 90 })
    .toFile(webpPath);

  // Soft cream plate JPEG for surfaces that need a solid photo (about / glow).
  await sharp(inputPath)
    .rotate()
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toFile(jpgPath);

  console.log(`ok ${outBase} (${side}x${side})`);
}

async function removeHorseAssets() {
  const names = await fs.readdir(OUT_DIR);
  const victims = names.filter((name) =>
    /^(western_floral_|premium_saddle|premium_halter|leather_bridle|leather_care|saddle_hero|saddlera_|hourse_shoe|hero-horse-|oak-rein-)/i.test(
      name,
    ),
  );
  for (const name of victims) {
    await fs.unlink(path.join(OUT_DIR, name));
    console.log(`removed ${name}`);
  }
  const videoDir = path.join(ROOT, "public/assets/videos");
  try {
    const videos = await fs.readdir(videoDir);
    for (const name of videos.filter((n) => /horse/i.test(n))) {
      await fs.unlink(path.join(videoDir, name));
      console.log(`removed video ${name}`);
    }
  } catch {
    /* optional */
  }
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const [slug, token] of Object.entries(MAP)) {
  const src = await findSource(token);
  await cutoutToSquare(src, `musafir-${slug}`);
}
await removeHorseAssets();
console.log("Menswear assets ready.");
