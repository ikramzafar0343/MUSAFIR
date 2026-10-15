import assert from "node:assert/strict";
import { test } from "node:test";

import {
  computeMatte,
  createMatteBuffers,
  defaultMatteParams,
  estimatePlate,
  type Rgb,
} from "@/server/media/hero-matte";

const WIDTH = 120;
const HEIGHT = 160;
const PLATE: Rgb = { r: 244, g: 244, b: 242 };
const COAT: Rgb = { r: 118, g: 58, b: 30 };
const BLAZE: Rgb = { r: 250, g: 250, b: 248 };

type Paint = (x: number, y: number) => { color: Rgb; cover: number } | null;

/** A frame on a slightly noisy studio plate, painted with `paint` (cover = subject share). */
function frameOn(plate: Rgb, paint: Paint): Uint8Array {
  const rgb = new Uint8Array(WIDTH * HEIGHT * 3);
  let seed = 7;
  const noise = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed % 5) - 2;
  };
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const i = (y * WIDTH + x) * 3;
      const hit = paint(x, y);
      const cover = hit?.cover ?? 0;
      const color = hit?.color ?? plate;
      rgb[i] = Math.round(color.r * cover + plate.r * (1 - cover)) + noise();
      rgb[i + 1] = Math.round(color.g * cover + plate.g * (1 - cover)) + noise();
      rgb[i + 2] = Math.round(color.b * cover + plate.b * (1 - cover)) + noise();
    }
  }
  return rgb;
}

function frame(paint: Paint): Uint8Array {
  return frameOn(PLATE, paint);
}

/** Horse-head stand-in: an ellipse joined to a neck that leaves through the bottom edge, with an enclosed blaze. */
function headPaint(centerX: number): Paint {
  return (x, y) => {
    const inBlaze = Math.abs(x - centerX) <= 4 && y >= 45 && y <= 95;
    if (inBlaze) return { color: BLAZE, cover: 1 };
    const dx = (x - centerX) / 34;
    const dy = (y - 70) / 48;
    const radial = Math.sqrt(dx * dx + dy * dy);
    const inNeck = y >= 70 && Math.abs(x - centerX) <= 26;
    if (inNeck || radial <= 0.95) return { color: COAT, cover: 1 };
    // Anti-aliased rim: coverage ramps down over about two pixels.
    if (radial < 1) return { color: COAT, cover: (1 - radial) / 0.05 };
    return null;
  };
}

function matte(rgb: Uint8Array) {
  const plate = estimatePlate(rgb, WIDTH, HEIGHT);
  assert.ok(plate, "plain backdrop should be detected");
  const alpha = new Uint8Array(WIDTH * HEIGHT);
  const premul = new Uint8Array(WIDTH * HEIGHT * 3);
  const stats = computeMatte(
    rgb,
    plate,
    defaultMatteParams(WIDTH, HEIGHT, plate),
    createMatteBuffers(WIDTH, HEIGHT),
    alpha,
    premul,
  );
  return { plate, alpha, premul, stats };
}

test("estimatePlate finds the studio backdrop colour", () => {
  const { plate } = matte(frame(headPaint(60)));
  assert.ok(Math.abs(plate.r - PLATE.r) < 3 && Math.abs(plate.g - PLATE.g) < 3 && Math.abs(plate.b - PLATE.b) < 3);
  assert.ok(plate.coverage > 0.9);
});

test("estimatePlate rejects a busy border", () => {
  const rgb = new Uint8Array(WIDTH * HEIGHT * 3);
  for (let i = 0; i < rgb.length; i += 1) rgb[i] = (i * 97) % 256;
  assert.equal(estimatePlate(rgb, WIDTH, HEIGHT), null);
});

test("estimatePlate tolerates uneven studio lighting on the top edge", () => {
  const rgb = frame(headPaint(60));
  for (let x = 0; x < WIDTH; x += 1) {
    const i = x * 3;
    const shade = Math.round((x / WIDTH) * 28);
    rgb[i] = Math.min(255, (rgb[i] ?? 0) + shade);
    rgb[i + 1] = Math.min(255, (rgb[i + 1] ?? 0) + shade);
    rgb[i + 2] = Math.min(255, (rgb[i + 2] ?? 0) + shade);
  }
  const plate = estimatePlate(rgb, WIDTH, HEIGHT);
  assert.ok(plate, "uneven plain backdrop should still be detected");
  assert.ok(plate.r > 180 && plate.g > 180 && plate.b > 180);
});

test("computeMatte keeps an enclosed white blaze solid and clears the backdrop", () => {
  const { alpha, stats } = matte(frame(headPaint(60)));
  const at = (x: number, y: number) => alpha[y * WIDTH + x] ?? -1;
  assert.equal(at(60, 70), 255, "blaze centre");
  assert.equal(at(60, 50), 255, "blaze top");
  assert.equal(at(40, 110), 255, "neck");
  assert.equal(at(2, 2), 0, "top-left backdrop");
  assert.equal(at(WIDTH - 3, 30), 0, "right backdrop");
  assert.equal(stats.clipped, false);
  assert.ok(stats.box && stats.box.minY >= 20 && stats.box.minY <= 24, "box starts at the head top");
  assert.equal(stats.box?.maxY, HEIGHT - 1, "neck reaches the bottom edge");
});

test("computeMatte gives rim pixels partial alpha with subject colour only", () => {
  const { alpha, premul } = matte(frame(headPaint(60)));
  let rims = 0;
  let worstExcess = 0;
  for (let p = 0; p < WIDTH * HEIGHT; p += 1) {
    const a = alpha[p] ?? 0;
    if (a === 0 || a === 255) continue;
    rims += 1;
    const coverage = a / 255;
    worstExcess = Math.max(
      worstExcess,
      (premul[p * 3] ?? 0) - COAT.r * coverage,
      (premul[p * 3 + 1] ?? 0) - COAT.g * coverage,
      (premul[p * 3 + 2] ?? 0) - COAT.b * coverage,
    );
  }
  assert.ok(rims > 20, "the anti-aliased rim is soft, not binary");
  // Keeping the plate in the rim would add about (1 - alpha) × 212 to blue: a white halo.
  assert.ok(worstExcess < 16, `rim colour carries plate (worst excess ${worstExcess.toFixed(1)})`);
});

test("computeMatte flags a subject cut off by a side of the frame", () => {
  const { stats } = matte(frame(headPaint(8)));
  assert.equal(stats.clipped, true);
});

test("computeMatte drops leftover backdrop islands after the plate flood", () => {
  const rgb = frame(headPaint(60));
  // Solid island of “subject” colour in the corner — must not survive isolation.
  for (let y = 2; y < 18; y += 1) {
    for (let x = 2; x < 18; x += 1) {
      const i = (y * WIDTH + x) * 3;
      rgb[i] = COAT.r;
      rgb[i + 1] = COAT.g;
      rgb[i + 2] = COAT.b;
    }
  }
  const { alpha } = matte(rgb);
  assert.equal(alpha[5 * WIDTH + 5] ?? -1, 0, "orphan island cleared");
  assert.equal(alpha[70 * WIDTH + 60] ?? -1, 255, "main subject kept");
});

test("computeMatte keeps a light blue suit on beige and clears the wall", () => {
  const BEIGE: Rgb = { r: 232, g: 218, b: 198 };
  const SUIT: Rgb = { r: 138, g: 168, b: 208 };
  const paint: Paint = (x, y) => {
    const dx = (x - 60) / 32;
    const dy = (y - 78) / 55;
    const radial = Math.sqrt(dx * dx + dy * dy);
    const inTorso = y >= 55 && Math.abs(x - 60) <= 28;
    if (inTorso || radial <= 0.92) return { color: SUIT, cover: 1 };
    if (radial < 1) return { color: SUIT, cover: (1 - radial) / 0.08 };
    return null;
  };
  const { alpha, stats } = matte(frameOn(BEIGE, paint));
  const at = (x: number, y: number) => alpha[y * WIDTH + x] ?? -1;
  assert.equal(at(2, 2), 0, "beige corner cleared");
  assert.equal(at(WIDTH - 3, 20), 0, "beige side cleared");
  assert.equal(at(60, 90), 255, "suit torso kept");
  assert.equal(at(48, 70), 255, "suit shoulder kept");
  assert.ok(stats.box, "subject bounds exist");
  assert.ok((stats.coverage ?? 0) > 0.08 && (stats.coverage ?? 0) < 0.55, "coverage is subject-sized");
});

test("computeMatte clears beige pockets inside the arms", () => {
  const BEIGE: Rgb = { r: 232, g: 218, b: 198 };
  const SUIT: Rgb = { r: 28, g: 26, b: 24 };
  // Sealed under-arm pockets (hands-in-pockets): beige is fully enclosed by suit,
  // matching real studio clips where the pocket does not touch the outer backdrop.
  const paint: Paint = (x, y) => {
    const inTorso = x >= 48 && x <= 72 && y >= 35 && y <= 155;
    const inLeftArm = x >= 16 && x <= 36 && y >= 48 && y <= 145;
    const inRightArm = x >= 84 && x <= 104 && y >= 48 && y <= 145;
    const leftTop = x >= 36 && x <= 48 && y >= 48 && y <= 64;
    const rightTop = x >= 72 && x <= 84 && y >= 48 && y <= 64;
    const leftBottom = x >= 36 && x <= 48 && y >= 128 && y <= 145;
    const rightBottom = x >= 72 && x <= 84 && y >= 128 && y <= 145;
    if (inTorso || inLeftArm || inRightArm || leftTop || rightTop || leftBottom || rightBottom) {
      return { color: SUIT, cover: 1 };
    }
    return null;
  };
  const { alpha } = matte(frameOn(BEIGE, paint));
  const at = (x: number, y: number) => alpha[y * WIDTH + x] ?? -1;
  assert.equal(at(2, 2), 0, "outer beige cleared");
  assert.equal(at(60, 100), 255, "torso kept");
  assert.equal(at(26, 100), 255, "left arm kept");
  assert.equal(at(94, 100), 255, "right arm kept");
  assert.equal(at(42, 90), 0, "left sealed under-arm beige cleared");
  assert.equal(at(78, 90), 0, "right sealed under-arm beige cleared");
  // Fringe peel should not leave a beige crumb on the pocket rim.
  assert.equal(at(42, 65), 0, "left pocket fringe cleared");
  assert.equal(at(78, 65), 0, "right pocket fringe cleared");
});
