import assert from "node:assert/strict";
import { describe, test } from "node:test";

import sharp from "sharp";

import { cutoutStillImage } from "@/server/media/still-cutout";

describe("cutoutStillImage", () => {
  test("clears a white studio plate to alpha", async () => {
    const input = await sharp({
      create: {
        width: 120,
        height: 160,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 48,
              height: 80,
              channels: 3,
              background: { r: 30, g: 60, b: 140 },
            },
          })
            .png()
            .toBuffer(),
          left: 36,
          top: 40,
        },
      ])
      .jpeg()
      .toBuffer();

    const result = await cutoutStillImage(input);
    assert.equal(result.cut, true);
    const { data, info } = await sharp(result.buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const cornerA = data[3]!;
    assert.ok(cornerA < 8, `corner should be transparent, got alpha ${cornerA}`);
    const mid = (((info.height / 2) | 0) * info.width + ((info.width / 2) | 0)) * info.channels;
    assert.ok(data[mid + 3]! > 200, "subject center should stay opaque");
  });

  test("edge pixels after cutout are not near-white RGB", async () => {
    const input = await sharp({
      create: {
        width: 140,
        height: 180,
        channels: 3,
        background: { r: 252, g: 252, b: 252 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 56,
              height: 90,
              channels: 3,
              background: { r: 90, g: 28, b: 38 },
            },
          })
            .png()
            .toBuffer(),
          left: 42,
          top: 45,
        },
      ])
      .png()
      .toBuffer();

    const result = await cutoutStillImage(input);
    assert.equal(result.cut, true);
    const { data, info } = await sharp(result.buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    let badEdge = 0;
    for (let y = 1; y < info.height - 1; y++) {
      for (let x = 1; x < info.width - 1; x++) {
        const i = (y * info.width + x) * ch;
        const a = data[i + 3]!;
        if (a < 40 || a > 220) continue;
        let touchesClear = false;
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ] as const) {
          const na = data[((y + dy) * info.width + (x + dx)) * ch + 3]!;
          if (na < 16) {
            touchesClear = true;
            break;
          }
        }
        if (!touchesClear) continue;
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;
        const lum = (r + g + b) / 3;
        const sat = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(1, Math.max(r, g, b));
        if (sat < 0.12 && lum > 210) badEdge += 1;
      }
    }
    assert.equal(badEdge, 0, `found ${badEdge} near-white fringe edge pixels`);
  });

  test("light beige suit on white plate survives (not eaten as backdrop)", async () => {
    // Beige fabric ~ (210, 190, 160) — must remain after plate flood.
    const beige = { r: 210, g: 190, b: 160 };
    const input = await sharp({
      create: {
        width: 160,
        height: 200,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 70,
              height: 110,
              channels: 3,
              background: beige,
            },
          })
            .png()
            .toBuffer(),
          left: 45,
          top: 40,
        },
      ])
      .png()
      .toBuffer();

    const result = await cutoutStillImage(input);
    assert.equal(result.cut, true);
    const { data, info } = await sharp(result.buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const mid = (((info.height / 2) | 0) * info.width + ((info.width / 2) | 0)) * info.channels;
    assert.ok(data[mid + 3]! > 200, "beige subject center must stay opaque");
    const r = data[mid]!;
    const g = data[mid + 1]!;
    const b = data[mid + 2]!;
    assert.ok(r > 160 && g > 140 && b > 110, `beige color preserved, got rgb(${r},${g},${b})`);
  });

  test("opaque white exterior fringe is eroded away", async () => {
    const w = 80;
    const h = 80;
    const rgba = Buffer.alloc(w * h * 4, 0);
    for (let y = 20; y < 60; y++) {
      for (let x = 20; x < 60; x++) {
        const i = (y * w + x) * 4;
        rgba[i] = 40;
        rgba[i + 1] = 50;
        rgba[i + 2] = 90;
        rgba[i + 3] = 255;
      }
    }
    // Fully opaque jagged white halo (the live bug).
    for (let y = 17; y < 63; y++) {
      for (let x = 17; x < 63; x++) {
        if (x >= 20 && x < 60 && y >= 20 && y < 60) continue;
        const i = (y * w + x) * 4;
        rgba[i] = 252;
        rgba[i + 1] = 250;
        rgba[i + 2] = 248;
        rgba[i + 3] = 255;
      }
    }
    const input = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
    const result = await cutoutStillImage(input);
    const { data, info } = await sharp(result.buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    let whiteEdge = 0;
    for (let y = 1; y < info.height - 1; y++) {
      for (let x = 1; x < info.width - 1; x++) {
        const i = (y * info.width + x) * ch;
        const a = data[i + 3]!;
        if (a < 40) continue;
        const lum = (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
        let touchesClear = false;
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ] as const) {
          if (data[((y + dy) * info.width + (x + dx)) * ch + 3]! < 16) {
            touchesClear = true;
            break;
          }
        }
        if (touchesClear && lum > 205) whiteEdge += 1;
      }
    }
    assert.equal(whiteEdge, 0, `opaque white fringe left ${whiteEdge} edge pixels`);
  });

  test("already-alpha PNG with white fringe gets decontaminated", async () => {
    const w = 64;
    const h = 64;
    const rgba = Buffer.alloc(w * h * 4, 0);
    // Opaque maroon subject in the middle.
    for (let y = 16; y < 48; y++) {
      for (let x = 16; x < 48; x++) {
        const i = (y * w + x) * 4;
        rgba[i] = 90;
        rgba[i + 1] = 28;
        rgba[i + 2] = 38;
        rgba[i + 3] = 255;
      }
    }
    // White fringe ring (semi-transparent) around the subject — classic bad cutout.
    for (let y = 14; y < 50; y++) {
      for (let x = 14; x < 50; x++) {
        if (x >= 16 && x < 48 && y >= 16 && y < 48) continue;
        const i = (y * w + x) * 4;
        rgba[i] = 250;
        rgba[i + 1] = 248;
        rgba[i + 2] = 245;
        rgba[i + 3] = 120;
      }
    }

    const input = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
    const result = await cutoutStillImage(input);
    const { data, info } = await sharp(result.buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    let whiteFringeLeft = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const i = (y * info.width + x) * ch;
        const a = data[i + 3]!;
        if (a < 20 || a > 240) continue;
        const lum = (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
        if (lum > 210) whiteFringeLeft += 1;
      }
    }
    assert.ok(whiteFringeLeft < 8, `white fringe should be cleared, left ${whiteFringeLeft}`);
    // Subject center still opaque maroon.
    const mid = (((info.height / 2) | 0) * info.width + ((info.width / 2) | 0)) * ch;
    assert.ok(data[mid + 3]! > 200);
    assert.ok(data[mid]! < 140);
  });
});
