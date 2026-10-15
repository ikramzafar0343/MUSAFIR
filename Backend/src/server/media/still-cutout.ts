import sharp from "sharp";

export type StillCutoutResult = {
  buffer: Buffer;
  width: number;
  height: number;
  /** True when a studio plate was cleared to alpha. */
  cut: boolean;
};

/**
 * Studio plate only — bright near-white with very low saturation.
 * Cream/beige garments (suits) must NOT match; they sit below these thresholds.
 */
function isBackdrop(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (r + g + b) / 3;
  // Pure / near-white plate (strict).
  if (r > 242 && g > 242 && b > 242 && sat < 0.04) return true;
  // Soft studio grey-white (border flood only — still strict vs beige fabric).
  if (sat < 0.055 && lum > 236) return true;
  if (sat < 0.035 && lum > 228) return true;
  return false;
}

function isNearWhiteFringe(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (r + g + b) / 3;
  // Broad enough to catch jagged studio fringe; still below typical beige fabric (~lum 180–200, sat ~0.1).
  return (sat < 0.14 && lum > 205) || (sat < 0.08 && lum > 198);
}

/** Erode exterior near-white (incl. fully opaque) so leftover plate halos disappear. */
function erodeExteriorWhite(rgba: Buffer, w: number, h: number, iterations = 3): void {
  const idx = (x: number, y: number) => (y * w + x) * 4;
  for (let iter = 0; iter < iterations; iter++) {
    const kill: number[] = [];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = idx(x, y);
        const a = rgba[i + 3]!;
        if (a < 8) continue;
        if (!isNearWhiteFringe(rgba[i]!, rgba[i + 1]!, rgba[i + 2]!)) continue;
        let touchesClear = false;
        for (const [dx, dy] of NEIGH8) {
          if (rgba[idx(x + dx, y + dy) + 3]! < 16) {
            touchesClear = true;
            break;
          }
        }
        if (touchesClear) kill.push(i);
      }
    }
    for (const i of kill) rgba[i + 3] = 0;
  }
}

const NEIGH8 = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const;

/**
 * Multi-pass color decontamination + fringe kill.
 * Partial-alpha / edge pixels get subject RGB (not plate white) so maroon boards
 * never show a white halo.
 */
function defringeRgba(rgba: Buffer, w: number, h: number, passes = 3): void {
  const idx = (x: number, y: number) => (y * w + x) * 4;

  for (let pass = 0; pass < passes; pass++) {
    const next = Buffer.from(rgba);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = idx(x, y);
        const a = rgba[i + 3]!;
        if (a < 4) continue;

        let touchesClear = false;
        let sr = 0;
        let sg = 0;
        let sb = 0;
        let sn = 0;
        for (const [dx, dy] of NEIGH8) {
          const n = idx(x + dx, y + dy);
          const na = rgba[n + 3]!;
          if (na < 16) {
            touchesClear = true;
            continue;
          }
          if (na > 200) {
            const nr = rgba[n]!;
            const ng = rgba[n + 1]!;
            const nb = rgba[n + 2]!;
            // Prefer non-white subject neighbors for decontamination.
            if (!isNearWhiteFringe(nr, ng, nb)) {
              sr += nr;
              sg += ng;
              sb += nb;
              sn += 1;
            }
          }
        }

        const r = rgba[i]!;
        const g = rgba[i + 1]!;
        const b = rgba[i + 2]!;

        if (touchesClear && isNearWhiteFringe(r, g, b)) {
          // White fringe on the cut edge — drop it entirely.
          next[i + 3] = 0;
          continue;
        }

        if (touchesClear && sn > 0) {
          next[i] = Math.round(sr / sn);
          next[i + 1] = Math.round(sg / sn);
          next[i + 2] = Math.round(sb / sn);
          // Soften partial plate bleed without leaving white RGB.
          if (a < 250 && isNearWhiteFringe(r, g, b)) {
            next[i + 3] = Math.min(a, 180);
          }
          continue;
        }

        // Interior-ish partial alpha with white cast — pull subject color anyway.
        if (a < 240 && sn > 0 && isNearWhiteFringe(r, g, b)) {
          next[i] = Math.round(sr / sn);
          next[i + 1] = Math.round(sg / sn);
          next[i + 2] = Math.round(sb / sn);
        }
      }
    }
    next.copy(rgba);
  }

  // Kill exterior near-white even when fully opaque (the jagged “border” halo).
  erodeExteriorWhite(rgba, w, h, 3);
}

function toRgbaBuffer(data: Buffer, w: number, h: number, channels: number): Buffer {
  if (channels === 4) {
    return Buffer.from(data);
  }
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const o = i * channels;
    const d = i * 4;
    rgba[d] = data[o]!;
    rgba[d + 1] = data[o + 1]!;
    rgba[d + 2] = data[o + 2]!;
    rgba[d + 3] = channels >= 4 ? data[o + 3]! : 255;
  }
  return rgba;
}

/**
 * Remove a studio white/cream backdrop (including under-arm pockets) and write a
 * square transparent PNG. Already-cut images are decontaminated (no second flood).
 */
export async function cutoutStillImage(input: Buffer): Promise<StillCutoutResult> {
  const { data, info } = await sharp(input).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  if (w < 8 || h < 8 || channels < 4) {
    const buffer = await sharp(input).rotate().png().toBuffer();
    const meta = await sharp(buffer).metadata();
    return { buffer, width: meta.width ?? w, height: meta.height ?? h, cut: false };
  }

  let transparent = 0;
  for (let i = 3; i < data.length; i += channels) {
    if (data[i]! < 8) transparent += 1;
  }
  const alreadyCut = transparent / (w * h) > 0.08;
  if (alreadyCut) {
    const rgba = toRgbaBuffer(data, w, h, channels);
    defringeRgba(rgba, w, h, 3);
    erodeExteriorWhite(rgba, w, h, 4);
    const buffer = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    return { buffer, width: w, height: h, cut: false };
  }

  const alpha = new Uint8Array(w * h).fill(255);
  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qh = 0;
  let qt = 0;

  const idx = (x: number, y: number) => y * w + x;
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = idx(x, y);
    if (seen[i]) return;
    const o = i * channels;
    if (!isBackdrop(data[o]!, data[o + 1]!, data[o + 2]!)) return;
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
    const i = queue[qh++]!;
    const x = i % w;
    const y = (i / w) | 0;
    alpha[i] = 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  // Enclosed plate pockets (under arms) — only true plate pixels.
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || alpha[i] === 0) continue;
    const o = i * channels;
    if (!isBackdrop(data[o]!, data[o + 1]!, data[o + 2]!)) continue;
    const seedQ = [i];
    seen[i] = 1;
    const region = [i];
    let touchesSubject = false;
    while (seedQ.length) {
      const cur = seedQ.pop()!;
      const x = cur % w;
      const y = (cur / w) | 0;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = idx(nx, ny);
        if (seen[ni]) continue;
        const no = ni * channels;
        if (isBackdrop(data[no]!, data[no + 1]!, data[no + 2]!)) {
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

  let cleared = 0;
  for (let i = 0; i < alpha.length; i++) {
    if (alpha[i] === 0) cleared += 1;
  }
  // Busy photos / no studio plate — keep original as PNG (still defringe if any alpha).
  if (cleared / (w * h) < 0.02) {
    const rgba = toRgbaBuffer(data, w, h, channels);
    defringeRgba(rgba, w, h, 2);
    const buffer = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const meta = await sharp(buffer).metadata();
    return { buffer, width: meta.width ?? w, height: meta.height ?? h, cut: false };
  }

  // Edge alpha from plate confidence — never leave white RGB on soft edges.
  const soft = new Uint8Array(w * h);
  for (let i = 0; i < soft.length; i++) soft[i] = alpha[i] === 0 ? 0 : 255;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = idx(x, y);
      if (soft[i] === 0) continue;
      const o = i * channels;
      const r = data[o]!;
      const g = data[o + 1]!;
      const b = data[o + 2]!;
      if (!isNearWhiteFringe(r, g, b) && !isBackdrop(r, g, b)) continue;
      let touch = false;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        if (soft[idx(x + dx, y + dy)] === 0) {
          touch = true;
          break;
        }
      }
      if (!touch) continue;
      const lum = (r + g + b) / 3;
      // Stronger falloff: bright plate edge → more transparent.
      soft[i] = Math.max(0, Math.min(255, Math.round(255 * ((230 - lum) / 40))));
    }
  }

  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const o = i * channels;
    const d = i * 4;
    rgba[d] = data[o]!;
    rgba[d + 1] = data[o + 1]!;
    rgba[d + 2] = data[o + 2]!;
    rgba[d + 3] = soft[i]!;
  }
  // Decontaminate + erode exterior white before crop.
  defringeRgba(rgba, w, h, 3);
  erodeExteriorWhite(rgba, w, h, 3);

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(idx(x, y) * 4) + 3]! < 16) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) {
    const buffer = await sharp(input).rotate().png().toBuffer();
    const meta = await sharp(buffer).metadata();
    return { buffer, width: meta.width ?? w, height: meta.height ?? h, cut: false };
  }

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
      canvas[t] = rgba[s]!;
      canvas[t + 1] = rgba[s + 1]!;
      canvas[t + 2] = rgba[s + 2]!;
      canvas[t + 3] = rgba[s + 3]!;
    }
  }

  defringeRgba(canvas, side, side, 2);
  erodeExteriorWhite(canvas, side, side, 3);

  const buffer = await sharp(canvas, { raw: { width: side, height: side, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  return { buffer, width: side, height: side, cut: true };
}
