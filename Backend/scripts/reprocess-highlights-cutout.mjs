/**
 * One-shot: re-matte the bundled Why MUSAFIR highlights PNG so the live
 * default asset no longer shows a white fringe (without requiring CMS re-upload).
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const target = path.join(repo, "Frontend/public/assets/images/musafir-highlights.png");

// Inline the cutout by spawning tsx on the module — keep script self-contained via dynamic import of compiled path.
const { cutoutStillImage } = await import("../src/server/media/still-cutout.ts");

const input = readFileSync(target);
const result = await cutoutStillImage(input);
writeFileSync(target, result.buffer);
const meta = await sharp(result.buffer).metadata();
console.log(
  JSON.stringify({
    path: target,
    cut: result.cut,
    width: result.width,
    height: result.height,
    hasAlpha: meta.hasAlpha,
    bytes: result.buffer.length,
  }),
);
