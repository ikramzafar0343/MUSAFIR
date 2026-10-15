/**
 * Soft matte for a subject filmed on a plain backdrop (white studio plate, black, or any
 * flat colour).
 *
 * The backdrop is flood-filled in from the frame border, so light areas enclosed by the
 * subject (a white blaze) stay solid. Pixels reachable from the backdrop through mixed,
 * lighter-than-subject colour get fractional alpha by projecting them onto the line
 * between the plate and the nearby solid colour. Colour is emitted premultiplied, and edge
 * pixels take the colour of the solid subject next to them rather than their own mix, so
 * no backdrop colour survives in the edges (no white halo on dark backgrounds).
 */

export type Rgb = { r: number; g: number; b: number };

export type PlateEstimate = Rgb & {
  /** 90th-percentile distance of the accepted border samples from the plate. */
  spread: number;
  /** Share of border samples that matched the plate. */
  coverage: number;
};

export type MatteParams = {
  /** A border-connected pixel closer than this to the plate is backdrop. */
  plateTolerance: number;
  /** Pixels closer than this to the plate may be a mix of plate and subject (hair, edges). */
  mixTolerance: number;
  /** How far (px) a mixed edge may reach in from the backdrop. */
  softReach: number;
  /** Window radius (px) used to sample the solid colour behind an edge pixel. */
  colorRadius: number;
  /** Top fraction of rows where touching a side border counts as a clipped subject. */
  headFraction: number;
};

export type MatteBox = { minX: number; minY: number; maxX: number; maxY: number };

export type MatteStats = {
  /** Bounds of pixels with visible alpha, or null for an empty frame. */
  box: MatteBox | null;
  /** Fraction of pixels that are at least half opaque. */
  coverage: number;
  /** Subject touches the top border, or a side border within the head rows. */
  clipped: boolean;
};

export type MatteBuffers = {
  width: number;
  height: number;
  dist: Uint16Array;
  state: Uint8Array;
  depth: Uint8Array;
  queue: Int32Array;
  /** Summed-area tables of solid pixels: r, g, b, count. */
  sums: [Uint32Array, Uint32Array, Uint32Array, Uint32Array];
};

const SOLID = 0;
const BACKDROP = 1;
const MIXED = 2;
const SKIN = 3;

/** Below this plate→subject contrast the projection is unreliable; keep such edges solid. */
const MIN_CONTRAST = 40;
/** Max chroma (max-min channel) above the plate’s chroma still treated as wall/beige. */
const PLATE_CHROMA_SLACK = 28;
/** Chromatic residual from plate beyond this → subject (e.g. blue suit vs beige wall). */
const PLATE_CHROM_DIST_MAX = 22;

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function channelChroma(r: number, g: number, b: number): number {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

/** True when a pixel looks like the studio plate (neutral beige/white), not tinted clothing. */
function isPlateLikePixel(
  r: number,
  g: number,
  b: number,
  plate: Rgb,
  dist: number,
  plateTolerance: number,
  plateChroma: number,
): boolean {
  if (dist >= plateTolerance) {
    return false;
  }
  const c = channelChroma(r, g, b);
  if (c > plateChroma + PLATE_CHROMA_SLACK && c > 35) {
    return false;
  }
  const dr = r - plate.r;
  const dg = g - plate.g;
  const db = b - plate.b;
  const mean = (dr + dg + db) / 3;
  const chromDist = Math.hypot(dr - mean, dg - mean, db - mean);
  return chromDist <= PLATE_CHROM_DIST_MAX;
}

export function createMatteBuffers(width: number, height: number): MatteBuffers {
  const pixels = width * height;
  const tableSize = (width + 1) * (height + 1);
  return {
    width,
    height,
    dist: new Uint16Array(pixels),
    state: new Uint8Array(pixels),
    depth: new Uint8Array(pixels),
    queue: new Int32Array(pixels),
    sums: [
      new Uint32Array(tableSize),
      new Uint32Array(tableSize),
      new Uint32Array(tableSize),
      new Uint32Array(tableSize),
    ],
  };
}

function plateFromOffsets(
  rgb: Uint8Array,
  offsets: readonly number[],
  matchDistance: number,
  minCoverage: number,
): PlateEstimate | null {
  if (offsets.length < 12) {
    return null;
  }
  const median = (channel: number) => {
    const values = offsets.map((offset) => rgb[offset + channel] ?? 0).sort((a, b) => a - b);
    return values[values.length >> 1] ?? 0;
  };
  const r0 = median(0);
  const g0 = median(1);
  const b0 = median(2);

  let sr = 0;
  let sg = 0;
  let sb = 0;
  const accepted: number[] = [];
  for (const offset of offsets) {
    const r = rgb[offset] ?? 0;
    const g = rgb[offset + 1] ?? 0;
    const b = rgb[offset + 2] ?? 0;
    const d = Math.hypot(r - r0, g - g0, b - b0);
    if (d <= matchDistance) {
      sr += r;
      sg += g;
      sb += b;
      accepted.push(offset);
    }
  }
  const coverage = accepted.length / offsets.length;
  if (coverage < minCoverage || accepted.length < 8) {
    return null;
  }
  const r = sr / accepted.length;
  const g = sg / accepted.length;
  const b = sb / accepted.length;
  const distances = accepted
    .map((offset) => Math.hypot((rgb[offset] ?? 0) - r, (rgb[offset + 1] ?? 0) - g, (rgb[offset + 2] ?? 0) - b))
    .sort((x, y) => x - y);
  const spread = distances[Math.floor((distances.length - 1) * 0.9)] ?? 0;
  return { r, g, b, spread, coverage };
}

/**
 * Plate colour from the top edge and upper sides only.
 * Lower sides/bottom often hit arms or a waist crop and would poison the plate
 * (e.g. light suit sampled as “backdrop” → room stays opaque, subject gets eaten).
 */
export function estimatePlate(rgb: Uint8Array, width: number, height: number): PlateEstimate | null {
  const step = Math.max(1, Math.round(Math.min(width, height) / 240));
  const sideRows = Math.max(1, Math.round(height * 0.45));
  const border: number[] = [];
  const topEdge: number[] = [];
  for (let x = 0; x < width; x += step) {
    const top = x * 3;
    border.push(top);
    topEdge.push(top);
  }
  for (let y = step; y < sideRows; y += step) {
    border.push(y * width * 3);
    border.push((y * width + width - 1) * 3);
  }

  // Prefer a clean top edge; then full upper-border with looser lighting tolerance.
  return (
    plateFromOffsets(rgb, topEdge, 40, 0.6) ??
    plateFromOffsets(rgb, border, 36, 0.35) ??
    plateFromOffsets(rgb, border, 55, 0.25) ??
    plateFromOffsets(rgb, topEdge, 58, 0.45)
  );
}

/** Median plate across frames — one stable backdrop colour keeps edges from flickering. */
export function combinePlates(plates: readonly PlateEstimate[]): PlateEstimate | null {
  if (plates.length === 0) {
    return null;
  }
  const pick = (key: keyof PlateEstimate) => {
    const values = plates.map((plate) => plate[key]).sort((a, b) => a - b);
    return values[values.length >> 1] ?? 0;
  };
  return { r: pick("r"), g: pick("g"), b: pick("b"), spread: pick("spread"), coverage: pick("coverage") };
}

export function defaultMatteParams(width: number, height: number, plate: PlateEstimate): MatteParams {
  const scale = Math.max(width, height) / 1080;
  return {
    plateTolerance: Math.min(56, Math.max(14, plate.spread * 2.8 + 14)),
    mixTolerance: 155,
    softReach: Math.max(2, Math.round(13 * scale)),
    colorRadius: Math.max(2, Math.round(6 * scale)),
    headFraction: 0.68,
  };
}

/**
 * Writes alpha (0–255, one byte per pixel) and, when `premulOut` is given, premultiplied
 * RGB (three bytes per pixel) for one frame.
 */
export function computeMatte(
  rgb: Uint8Array,
  plate: Rgb,
  params: MatteParams,
  buffers: MatteBuffers,
  alphaOut: Uint8Array,
  premulOut: Uint8Array | null,
): MatteStats {
  const { width: w, height: h, dist, state, depth, queue, sums } = buffers;
  const n = w * h;
  const pr = plate.r;
  const pg = plate.g;
  const pb = plate.b;

  const plateChroma = channelChroma(pr, pg, pb);

  // 1) Distance of every pixel from the plate colour.
  for (let p = 0, i = 0; p < n; p += 1, i += 3) {
    const dr = (rgb[i] ?? 0) - pr;
    const dg = (rgb[i + 1] ?? 0) - pg;
    const db = (rgb[i + 2] ?? 0) - pb;
    dist[p] = Math.sqrt(dr * dr + dg * dg + db * db);
  }
  state.fill(SOLID);

  // 2) Flood backdrop from the border — only near-neutral plate-like pixels (beige/white).
  // Tinted clothing (blue suit) stays subject even when luma is close to the wall.
  const plateTolerance = params.plateTolerance;
  let head = 0;
  let tail = 0;
  const seedBackdrop = (p: number) => {
    if (state[p] !== SOLID) return;
    const i = p * 3;
    if (
      !isPlateLikePixel(
        rgb[i] ?? 0,
        rgb[i + 1] ?? 0,
        rgb[i + 2] ?? 0,
        plate,
        dist[p] ?? 0,
        plateTolerance,
        plateChroma,
      )
    ) {
      return;
    }
    state[p] = BACKDROP;
    queue[tail++] = p;
  };
  const lastRow = n - w;
  for (let x = 0; x < w; x += 1) {
    seedBackdrop(x);
    seedBackdrop(lastRow + x);
  }
  for (let y = 1; y < h - 1; y += 1) {
    seedBackdrop(y * w);
    seedBackdrop(y * w + w - 1);
  }
  while (head < tail) {
    const p = queue[head++] ?? 0;
    const x = p % w;
    if (x > 0) seedBackdrop(p - 1);
    if (x < w - 1) seedBackdrop(p + 1);
    if (p >= w) seedBackdrop(p - w);
    if (p < lastRow) seedBackdrop(p + w);
  }

  // 3) Mixed band: soft edge only through plate-like (or near-plate) neighbours.
  const mixTolerance = params.mixTolerance;
  const reach = params.softReach;
  const isBackdrop = (q: number) => state[q] === BACKDROP;
  const canMix = (q: number) => {
    if (state[q] !== SOLID || (dist[q] ?? 0) >= mixTolerance) return false;
    const i = q * 3;
    // Allow a wider mix band for AA edges, but still block strong hue (suit vs wall).
    return isPlateLikePixel(
      rgb[i] ?? 0,
      rgb[i + 1] ?? 0,
      rgb[i + 2] ?? 0,
      plate,
      dist[q] ?? 0,
      mixTolerance,
      plateChroma,
    );
  };
  head = 0;
  tail = 0;
  for (let p = 0; p < n; p += 1) {
    if (!canMix(p)) continue;
    const x = p % w;
    if (
      (x > 0 && isBackdrop(p - 1)) ||
      (x < w - 1 && isBackdrop(p + 1)) ||
      (p >= w && isBackdrop(p - w)) ||
      (p < lastRow && isBackdrop(p + w))
    ) {
      state[p] = MIXED;
      depth[p] = 1;
      queue[tail++] = p;
    }
  }
  while (head < tail) {
    const p = queue[head++] ?? 0;
    const d = depth[p] ?? 0;
    if (d >= reach) continue;
    const x = p % w;
    const visit = (q: number) => {
      if (canMix(q)) {
        state[q] = MIXED;
        depth[q] = d + 1;
        queue[tail++] = q;
      }
    };
    if (x > 0) visit(p - 1);
    if (x < w - 1) visit(p + 1);
    if (p >= w) visit(p - w);
    if (p < lastRow) visit(p + w);
  }

  // 3b) The outermost solid ring is still an anti-aliased step; give it computed alpha too.
  const isOpen = (q: number) => state[q] === BACKDROP || state[q] === MIXED;
  for (let p = 0; p < n; p += 1) {
    if (state[p] !== SOLID) continue;
    const x = p % w;
    if (
      (x > 0 && isOpen(p - 1)) ||
      (x < w - 1 && isOpen(p + 1)) ||
      (p >= w && isOpen(p - w)) ||
      (p < lastRow && isOpen(p + w))
    ) {
      state[p] = SKIN;
      queue[tail++] = p;
    }
  }
  const softCount = tail;

  // 4) Summed-area tables of solid colour, for the local subject colour behind each edge.
  const [sumR, sumG, sumB, sumN] = sums;
  const stride = w + 1;
  let fallbackR = 0;
  let fallbackG = 0;
  let fallbackB = 0;
  for (let y = 0; y < h; y += 1) {
    let rowR = 0;
    let rowG = 0;
    let rowB = 0;
    let rowN = 0;
    const src = y * w;
    const above = y * stride;
    const here = (y + 1) * stride;
    for (let x = 0; x < w; x += 1) {
      const p = src + x;
      if (state[p] === SOLID) {
        const i = p * 3;
        rowR += rgb[i] ?? 0;
        rowG += rgb[i + 1] ?? 0;
        rowB += rgb[i + 2] ?? 0;
        rowN += 1;
      }
      sumR[here + x + 1] = (sumR[above + x + 1] ?? 0) + rowR;
      sumG[here + x + 1] = (sumG[above + x + 1] ?? 0) + rowG;
      sumB[here + x + 1] = (sumB[above + x + 1] ?? 0) + rowB;
      sumN[here + x + 1] = (sumN[above + x + 1] ?? 0) + rowN;
    }
  }
  const totalSolid = sumN[h * stride + w] ?? 0;
  if (totalSolid > 0) {
    fallbackR = (sumR[h * stride + w] ?? 0) / totalSolid;
    fallbackG = (sumG[h * stride + w] ?? 0) / totalSolid;
    fallbackB = (sumB[h * stride + w] ?? 0) / totalSolid;
  }

  // 5) Fractional alpha for the mixed band and the skin ring.
  const radius = params.colorRadius;
  const boxSum = (table: Uint32Array, x0: number, y0: number, x1: number, y1: number) =>
    (table[(y1 + 1) * stride + x1 + 1] ?? 0) -
    (table[y0 * stride + x1 + 1] ?? 0) -
    (table[(y1 + 1) * stride + x0] ?? 0) +
    (table[y0 * stride + x0] ?? 0);
  for (let k = 0; k < softCount; k += 1) {
    const p = queue[k] ?? 0;
    const x = p % w;
    const y = (p - x) / w;
    const x0 = x > radius ? x - radius : 0;
    const y0 = y > radius ? y - radius : 0;
    const x1 = x + radius < w ? x + radius : w - 1;
    const y1 = y + radius < h ? y + radius : h - 1;
    const count = boxSum(sumN, x0, y0, x1, y1);
    let fr = fallbackR;
    let fg = fallbackG;
    let fb = fallbackB;
    if (count > 0) {
      fr = boxSum(sumR, x0, y0, x1, y1) / count;
      fg = boxSum(sumG, x0, y0, x1, y1) / count;
      fb = boxSum(sumB, x0, y0, x1, y1) / count;
    }
    const ur = fr - pr;
    const ug = fg - pg;
    const ub = fb - pb;
    const contrast = ur * ur + ug * ug + ub * ub;
    let a: number;
    if (contrast < MIN_CONTRAST * MIN_CONTRAST) {
      a = state[p] === SKIN ? 1 : clamp01((dist[p] ?? 0) / 60);
    } else {
      const i = p * 3;
      const vr = (rgb[i] ?? 0) - pr;
      const vg = (rgb[i + 1] ?? 0) - pg;
      const vb = (rgb[i + 2] ?? 0) - pb;
      a = (vr * ur + vg * ug + vb * ub) / contrast;
    }
    // Gate codec noise to clear, and let nearly solid pixels land fully opaque.
    const alpha = Math.round(clamp01((a - 0.04) / 0.93) * 255);
    alphaOut[p] = alpha;
    if (premulOut) {
      const i = p * 3;
      const coverage = alpha / 255;
      premulOut[i] = Math.round(fr * coverage);
      premulOut[i + 1] = Math.round(fg * coverage);
      premulOut[i + 2] = Math.round(fb * coverage);
    }
  }

  // 6) Alpha and premultiplied colour for backdrop / solid pixels.
  for (let p = 0, i = 0; p < n; p += 1, i += 3) {
    const s = state[p];
    if (s === BACKDROP) {
      alphaOut[p] = 0;
      if (premulOut) {
        premulOut[i] = 0;
        premulOut[i + 1] = 0;
        premulOut[i + 2] = 0;
      }
    } else if (s === SOLID) {
      alphaOut[p] = 255;
      if (premulOut) {
        premulOut[i] = rgb[i] ?? 0;
        premulOut[i + 1] = rgb[i + 1] ?? 0;
        premulOut[i + 2] = rgb[i + 2] ?? 0;
      }
    }
  }

  // 7) Keep only the primary subject blob — leftover room/backdrop islands go transparent.
  isolatePrimarySubject(alphaOut, premulOut, w, h, queue);
  // 8) Close small holes punched through light clothing / jagged matte edges.
  // Keep radius small — hole-fill only; large radii dominate encode time on HD frames.
  morphCloseSilhouette(
    alphaOut,
    premulOut,
    rgb,
    w,
    h,
    Math.min(2, Math.max(1, Math.round(params.softReach / 4))),
    plate,
    params.plateTolerance,
  );
  // 9) Punch beige/white under-arm pockets (open bays + sealed plate holes).
  clearPlatePockets(alphaOut, premulOut, rgb, plate, params.plateTolerance, w, h, queue);
  return measureMatteStats(alphaOut, w, h, params.headFraction);
}

/** Neutral light backdrop — includes shadowed plate that fails a tight plateTolerance. */
function isPunchablePlate(
  r: number,
  g: number,
  b: number,
  plate: Rgb,
  plateTolerance: number,
  plateChroma: number,
): boolean {
  const dist = Math.hypot(r - plate.r, g - plate.g, b - plate.b);
  if (isPlateLikePixel(r, g, b, plate, dist, plateTolerance * 1.35, plateChroma)) {
    return true;
  }
  const chroma = channelChroma(r, g, b);
  if (chroma > plateChroma + PLATE_CHROMA_SLACK + 14 && chroma > 40) {
    return false;
  }
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  const plateLuma = 0.299 * plate.r + 0.587 * plate.g + 0.114 * plate.b;
  // Shadowed beige wall still reads as backdrop if neutral and not too dark.
  return luma >= 145 && Math.abs(luma - plateLuma) <= plateTolerance * 1.8 && dist <= plateTolerance * 2.2;
}

/**
 * Clears studio-plate pockets under arms (open bays + sealed holes).
 * Kept O(pixels) — a large morphological erode here previously timed out HD encodes.
 */
export function clearPlatePockets(
  alphaOut: Uint8Array,
  premulOut: Uint8Array | null,
  rgb: Uint8Array,
  plate: Rgb,
  plateTolerance: number,
  w: number,
  h: number,
  queue: Int32Array,
): void {
  const n = w * h;
  const plateChroma = channelChroma(plate.r, plate.g, plate.b);
  const punchable = new Uint8Array(n);
  const core = new Uint8Array(n);
  for (let p = 0, i = 0; p < n; p += 1, i += 3) {
    if ((alphaOut[p] ?? 0) < 96) continue;
    if (isPunchablePlate(rgb[i] ?? 0, rgb[i + 1] ?? 0, rgb[i + 2] ?? 0, plate, plateTolerance, plateChroma)) {
      punchable[p] = 1;
    } else {
      core[p] = 1;
    }
  }

  // Exterior = border flood through anything that is not solid suit/core (incl. plate + transparent).
  const exterior = new Uint8Array(n);
  let head = 0;
  let tail = 0;
  const seed = (p: number) => {
    if (p < 0 || p >= n || exterior[p] || core[p]) return;
    exterior[p] = 1;
    queue[tail++] = p;
  };
  const lastRow = n - w;
  for (let x = 0; x < w; x += 1) {
    seed(x);
    seed(lastRow + x);
  }
  for (let y = 1; y < h - 1; y += 1) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  while (head < tail) {
    const p = queue[head++] ?? 0;
    const x = p % w;
    if (x > 0) seed(p - 1);
    if (x < w - 1) seed(p + 1);
    if (p >= w) seed(p - w);
    if (p < lastRow) seed(p + w);
    if (x > 0 && p >= w) seed(p - w - 1);
    if (x < w - 1 && p >= w) seed(p - w + 1);
    if (x > 0 && p < lastRow) seed(p + w - 1);
    if (x < w - 1 && p < lastRow) seed(p + w + 1);
  }

  const clearAt = (p: number) => {
    alphaOut[p] = 0;
    punchable[p] = 0;
    if (premulOut) {
      const i = p * 3;
      premulOut[i] = 0;
      premulOut[i + 1] = 0;
      premulOut[i + 2] = 0;
    }
  };

  // Open / nearly-open plate bays reachable from the outside.
  for (let p = 0; p < n; p += 1) {
    if (exterior[p] && punchable[p]) clearAt(p);
  }

  // Sealed under-arm triangles: large plate islands fully enclosed by the suit.
  // Keep small enclosed detail (white blaze); threshold scales with frame size.
  const minHole = Math.max(500, Math.round(w * h * 0.006));
  const seen = new Uint8Array(n);
  for (let seedP = 0; seedP < n; seedP += 1) {
    if (seen[seedP] || !punchable[seedP]) continue;
    head = 0;
    tail = 0;
    queue[tail++] = seedP;
    seen[seedP] = 1;
    let size = 0;
    let touchesExterior = false;
    const start = tail - 1;
    while (head < tail) {
      const p = queue[head++] ?? 0;
      size += 1;
      if (exterior[p]) touchesExterior = true;
      const x = p % w;
      const visit = (q: number) => {
        if (q < 0 || q >= n || seen[q] || !punchable[q]) return;
        seen[q] = 1;
        queue[tail++] = q;
      };
      if (x > 0) visit(p - 1);
      if (x < w - 1) visit(p + 1);
      if (p >= w) visit(p - w);
      if (p < lastRow) visit(p + w);
    }
    if (touchesExterior || size < minHole) continue;
    for (let i = start; i < tail; i += 1) {
      clearAt(queue[i] ?? 0);
    }
  }

  const touchesClear = (p: number) => {
    const x = p % w;
    return (
      (x > 0 && (alphaOut[p - 1] ?? 0) < 96) ||
      (x < w - 1 && (alphaOut[p + 1] ?? 0) < 96) ||
      (p >= w && (alphaOut[p - w] ?? 0) < 96) ||
      (p < lastRow && (alphaOut[p + w] ?? 0) < 96)
    );
  };

  // Peel 2px of leftover beige fringe around punched pockets / outer edge.
  for (let pass = 0; pass < 2; pass += 1) {
    tail = 0;
    for (let p = 0, i = 0; p < n; p += 1, i += 3) {
      const a = alphaOut[p] ?? 0;
      if (a < 1) continue;
      if (!isPunchablePlate(rgb[i] ?? 0, rgb[i + 1] ?? 0, rgb[i + 2] ?? 0, plate, plateTolerance, plateChroma)) {
        continue;
      }
      if (a < 96 || touchesClear(p)) {
        queue[tail++] = p;
      }
    }
    for (let i = 0; i < tail; i += 1) {
      clearAt(queue[i] ?? 0);
    }
  }

  // Speckles of plate on the silhouette (enclosed blaze does not touch clear pixels).
  const maxCrumb = Math.max(32, Math.round(w * h * 0.00045));
  seen.fill(0);
  for (let seedP = 0; seedP < n; seedP += 1) {
    if (seen[seedP] || (alphaOut[seedP] ?? 0) < 96) continue;
    const si = seedP * 3;
    if (!isPunchablePlate(rgb[si] ?? 0, rgb[si + 1] ?? 0, rgb[si + 2] ?? 0, plate, plateTolerance, plateChroma)) {
      continue;
    }
    head = 0;
    tail = 0;
    queue[tail++] = seedP;
    seen[seedP] = 1;
    let size = 0;
    let onEdge = false;
    const start = tail - 1;
    while (head < tail) {
      const p = queue[head++] ?? 0;
      size += 1;
      if (touchesClear(p)) onEdge = true;
      const x = p % w;
      const visit = (q: number) => {
        if (q < 0 || q >= n || seen[q] || (alphaOut[q] ?? 0) < 96) return;
        const qi = q * 3;
        if (!isPunchablePlate(rgb[qi] ?? 0, rgb[qi + 1] ?? 0, rgb[qi + 2] ?? 0, plate, plateTolerance, plateChroma)) {
          return;
        }
        seen[q] = 1;
        queue[tail++] = q;
      };
      if (x > 0) visit(p - 1);
      if (x < w - 1) visit(p + 1);
      if (p >= w) visit(p - w);
      if (p < lastRow) visit(p + w);
    }
    if (!onEdge || size > maxCrumb) continue;
    for (let i = start; i < tail; i += 1) {
      clearAt(queue[i] ?? 0);
    }
  }
}

/**
 * Dilate then erode the silhouette to seal small interior holes without growing the outline much.
 */
export function morphCloseSilhouette(
  alphaOut: Uint8Array,
  premulOut: Uint8Array | null,
  rgb: Uint8Array,
  w: number,
  h: number,
  radius: number,
  plate?: Rgb,
  plateTolerance?: number,
): void {
  const n = w * h;
  const rad = Math.max(1, Math.min(radius, 4));
  const src = new Uint8Array(n);
  for (let p = 0; p < n; p += 1) {
    src[p] = (alphaOut[p] ?? 0) >= 96 ? 1 : 0;
  }
  const plateChroma = plate ? channelChroma(plate.r, plate.g, plate.b) : 0;
  const tol = plateTolerance ?? 0;
  const isPlateAt = (p: number) => {
    if (!plate) return false;
    const i = p * 3;
    const r = rgb[i] ?? 0;
    const g = rgb[i + 1] ?? 0;
    const b = rgb[i + 2] ?? 0;
    const dist = Math.hypot(r - plate.r, g - plate.g, b - plate.b);
    return isPlateLikePixel(r, g, b, plate, dist, tol, plateChroma);
  };
  const dilate = (input: Uint8Array): Uint8Array => {
    const out = new Uint8Array(n);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        let on = 0;
        for (let dy = -rad; dy <= rad && !on; dy += 1) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -rad; dx <= rad; dx += 1) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            if (input[yy * w + xx]) {
              on = 1;
              break;
            }
          }
        }
        out[y * w + x] = on;
      }
    }
    return out;
  };
  const erode = (input: Uint8Array): Uint8Array => {
    const out = new Uint8Array(n);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        let on = 1;
        for (let dy = -rad; dy <= rad && on; dy += 1) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) {
            on = 0;
            break;
          }
          for (let dx = -rad; dx <= rad; dx += 1) {
            const xx = x + dx;
            if (xx < 0 || xx >= w || !input[yy * w + xx]) {
              on = 0;
              break;
            }
          }
        }
        out[y * w + x] = on;
      }
    }
    return out;
  };

  // Close = dilate then erode, but only *add* filled holes — never shrink the outline
  // (eroding would pull subjects off the frame edge and break clipped detection).
  // Never fill plate-coloured gaps (under-arm beige) back in as subject.
  const closed = erode(dilate(src));
  for (let p = 0, i = 0; p < n; p += 1, i += 3) {
    if (closed[p] && !src[p] && !isPlateAt(p)) {
      alphaOut[p] = 255;
      if (premulOut) {
        premulOut[i] = rgb[i] ?? 0;
        premulOut[i + 1] = rgb[i + 1] ?? 0;
        premulOut[i + 2] = rgb[i + 2] ?? 0;
      }
    }
  }
}

/**
 * After the plate flood, leftover backdrop often remains as opaque islands.
 * Keep the largest subject component (prefer one touching the bottom edge), clear the rest.
 */
export function isolatePrimarySubject(
  alphaOut: Uint8Array,
  premulOut: Uint8Array | null,
  w: number,
  h: number,
  queue: Int32Array,
): void {
  const n = w * h;
  const labels = new Int32Array(n);
  labels.fill(-1);
  const areas: number[] = [];
  const touchesBottom: boolean[] = [];
  let labelCount = 0;
  const opaqueAt = (p: number) => (alphaOut[p] ?? 0) >= 96;

  for (let seed = 0; seed < n; seed += 1) {
    if (!opaqueAt(seed) || labels[seed] !== -1) continue;
    const id = labelCount;
    labelCount += 1;
    areas[id] = 0;
    touchesBottom[id] = false;
    let head = 0;
    let tail = 0;
    queue[tail++] = seed;
    labels[seed] = id;
    while (head < tail) {
      const p = queue[head++] ?? 0;
      areas[id] = (areas[id] ?? 0) + 1;
      const x = p % w;
      const y = (p - x) / w;
      if (y >= h - 1) touchesBottom[id] = true;
      const visit = (q: number) => {
        if (q < 0 || q >= n || labels[q] !== -1 || !opaqueAt(q)) return;
        labels[q] = id;
        queue[tail++] = q;
      };
      if (x > 0) visit(p - 1);
      if (x < w - 1) visit(p + 1);
      if (p >= w) visit(p - w);
      if (p < n - w) visit(p + w);
    }
  }

  let keep = -1;
  let keepArea = 0;
  for (let id = 0; id < labelCount; id += 1) {
    const area = areas[id] ?? 0;
    if (touchesBottom[id] && area > keepArea) {
      keep = id;
      keepArea = area;
    }
  }
  if (keep < 0) {
    for (let id = 0; id < labelCount; id += 1) {
      const area = areas[id] ?? 0;
      if (area > keepArea) {
        keep = id;
        keepArea = area;
      }
    }
  }

  for (let p = 0, i = 0; p < n; p += 1, i += 3) {
    if (keep >= 0 && labels[p] === keep) continue;
    alphaOut[p] = 0;
    if (premulOut) {
      premulOut[i] = 0;
      premulOut[i + 1] = 0;
      premulOut[i + 2] = 0;
    }
  }
}

function measureMatteStats(alphaOut: Uint8Array, w: number, h: number, headFraction: number): MatteStats {
  const n = w * h;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  let opaque = 0;
  for (let p = 0; p < n; p += 1) {
    const a = alphaOut[p] ?? 0;
    if (a > 8) {
      const x = p % w;
      const y = (p - x) / w;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    if (a >= 128) opaque += 1;
  }

  let contact = 0;
  const headRows = Math.round(h * headFraction);
  for (let x = 0; x < w; x += 1) {
    if ((alphaOut[x] ?? 0) >= 128) contact += 1;
  }
  for (let y = 0; y < headRows; y += 1) {
    if ((alphaOut[y * w] ?? 0) >= 128) contact += 1;
    if ((alphaOut[y * w + w - 1] ?? 0) >= 128) contact += 1;
  }

  return {
    box: maxX >= minX && maxY >= minY ? { minX, minY, maxX, maxY } : null,
    coverage: opaque / n,
    clipped: contact > Math.max(2, Math.round(h * 0.01)),
  };
}
