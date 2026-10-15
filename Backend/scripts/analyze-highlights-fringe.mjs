import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { cutoutStillImage } from "../src/server/media/still-cutout.ts";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const target = path.join(repo, "Frontend/public/assets/images/musafir-highlights.png");

function countWhiteEdge(buf) {
  return sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const ch = info.channels;
      let whiteEdge = 0;
      let opaque = 0;
      for (let y = 1; y < info.height - 1; y++) {
        for (let x = 1; x < info.width - 1; x++) {
          const i = (y * info.width + x) * ch;
          const a = data[i + 3];
          if (a < 16) continue;
          opaque += 1;
          const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
          let clear = false;
          for (const [dx, dy] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]) {
            if (data[((y + dy) * info.width + (x + dx)) * ch + 3] < 16) {
              clear = true;
              break;
            }
          }
          if (clear && lum > 205 && a > 40) whiteEdge += 1;
        }
      }
      return { w: info.width, h: info.height, opaque, whiteEdge };
    });
}

const raw = readFileSync(target);
const before = await countWhiteEdge(raw);
const cut = await cutoutStillImage(raw);
const after = await countWhiteEdge(cut.buffer);
console.log(JSON.stringify({ before, after, cut: cut.cut }, null, 2));
