import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_HERO_VIDEO, isStackedAlphaVideoSrc, resolveHeroVideoSet } from "@/lib/hero-video";

const RENDER = {
  src: "/uploads/hero-1790000000000-a1b2c3-alpha-hd.mp4",
  mobileSrc: "/uploads/hero-1790000000000-a1b2c3-alpha-sd.mp4",
  posterSrc: "/uploads/hero-1790000000000-a1b2c3-alpha-poster.webp",
};

test("recognises stacked-alpha renders only", () => {
  assert.equal(isStackedAlphaVideoSrc(RENDER.src), true);
  assert.equal(isStackedAlphaVideoSrc(`${RENDER.mobileSrc}?v=2`), true);
  assert.equal(isStackedAlphaVideoSrc("/uploads/1789853694994-4f51d820174a.mp4"), false);
  assert.equal(isStackedAlphaVideoSrc(""), false);
  assert.equal(isStackedAlphaVideoSrc(null), false);
});

test("a complete render is used as stored", () => {
  assert.deepEqual(resolveHeroVideoSet(RENDER), RENDER);
});

test("empty, cleared or unconverted heroes fall back to the bundled set as a whole", () => {
  assert.deepEqual(resolveHeroVideoSet({}), DEFAULT_HERO_VIDEO);
  assert.deepEqual(resolveHeroVideoSet({ src: "", mobileSrc: "", posterSrc: "" }), DEFAULT_HERO_VIDEO);
  assert.deepEqual(
    resolveHeroVideoSet({
      src: "/uploads/1789853694994-4f51d820174a.mp4",
      mobileSrc: RENDER.mobileSrc,
      posterSrc: RENDER.posterSrc,
    }),
    DEFAULT_HERO_VIDEO,
  );
});

test("a render is never paired with another render's files", () => {
  assert.deepEqual(
    resolveHeroVideoSet({
      src: RENDER.src,
      mobileSrc: DEFAULT_HERO_VIDEO.mobileSrc,
      posterSrc: DEFAULT_HERO_VIDEO.posterSrc,
    }),
    RENDER,
  );
  assert.deepEqual(resolveHeroVideoSet({ src: RENDER.src }), RENDER);
});
