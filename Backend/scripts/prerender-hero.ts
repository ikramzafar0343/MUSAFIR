/**
 * CLI: render the bundled default hero cutout (stacked-alpha desktop + mobile MP4, WebP
 * poster) into Frontend/public/assets from a plain-backdrop source clip.
 * Usage: npm run prerender:hero --prefix Backend [-- path/to/source.mp4]
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { prerenderHeroVideo } from "../src/server/media/prerender-hero";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");
const repoRoot = path.resolve(backendRoot, "..");
const inputArg = process.argv[2];
const inputPath = inputArg ? path.resolve(inputArg) : path.join(backendRoot, "assets", "hero-source.mp4");

const started = Date.now();
const result = await prerenderHeroVideo({
  inputPath,
  outputDir: path.join(repoRoot, "Frontend", "public", "assets", "videos"),
  posterDir: path.join(repoRoot, "Frontend", "public", "assets", "images"),
  basename: "hero-horse",
});

console.log(`Hero cutout rendered in ${((Date.now() - started) / 1000).toFixed(1)}s from ${inputPath}`);
const loop =
  result.plan.kind === "cut"
    ? `cut loop of source frames ${result.plan.start}-${result.plan.end - 1}`
    : `bounce between source frames ${result.plan.from} and ${result.plan.to}`;
console.log(`  ${result.width}x${result.height} colour, ${result.frames} frames @ ${result.fps} fps, ${loop}`);
console.log(`  src:       ${result.src}`);
console.log(`  mobileSrc: ${result.mobileSrc}`);
console.log(`  posterSrc: ${result.posterSrc}`);
