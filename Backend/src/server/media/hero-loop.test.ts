import assert from "node:assert/strict";
import { test } from "node:test";

import { type FrameMix, type LoopSearch, planFrames, planLoop, planSources } from "@/server/media/hero-loop";

const FPS = 24;

function search(frameCount: number, position: (k: number) => number[], usable?: (k: number) => boolean): LoopSearch {
  return {
    frameCount,
    fps: FPS,
    usable: Array.from({ length: frameCount }, (_, k) => usable?.(k) ?? true),
    distance: (a, b) => Math.hypot(...position(a).map((value, i) => value - (position(b)[i] ?? 0))),
    crossfade: 6,
  };
}

function assertWellFormed(frames: FrameMix[]) {
  assert.ok(frames.length > 0);
  assert.equal(frames[0]?.length, 1, "frame 0 is one untouched source frame (matches the poster)");
  assert.equal(frames[0]?.[0]?.weight, 1);
  for (const mix of frames) {
    const total = mix.reduce((sum, part) => sum + part.weight, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, "weights sum to 1");
  }
}

test("periodic motion loops with a cut one period long", () => {
  const period = 48;
  const plan = planLoop(
    search(150, (k) => [Math.cos((2 * Math.PI * k) / period), Math.sin((2 * Math.PI * k) / period)]),
  );
  assert.equal(plan.kind, "cut");
  if (plan.kind !== "cut") return;
  assert.equal((plan.end - plan.start) % period, 0, "seam lands on the same pose");
  const frames = planFrames(plan);
  assertWellFormed(frames);
  assert.equal(frames.length, plan.end - plan.start);
});

test("motion that never returns bounces instead of jumping", () => {
  const plan = planLoop(search(120, (k) => [k * 0.5]));
  assert.equal(plan.kind, "bounce");
  if (plan.kind !== "bounce") return;
  const frames = planFrames(plan);
  assertWellFormed(frames);
  assert.equal(frames.length, plan.frames);
  assert.equal(frames[0]?.[0]?.source, plan.from);

  const positions = frames.map((mix) => mix.reduce((sum, part) => sum + part.source * part.weight, 0));
  const { first, last } = planSources(plan);
  for (let i = 0; i < positions.length; i += 1) {
    const here = positions[i] ?? 0;
    const next = positions[(i + 1) % positions.length] ?? 0;
    assert.ok(here >= first - 1e-9 && here <= last + 1e-9, "stays inside the planned sources");
    assert.ok(Math.abs(next - here) <= 0.86, "never faster than the peak speed, including across the loop");
  }
});

test("frames with a clipped subject are never used", () => {
  const period = 48;
  const plan = planLoop(
    search(
      150,
      (k) => [Math.cos((2 * Math.PI * k) / period), Math.sin((2 * Math.PI * k) / period)],
      (k) => k >= 40,
    ),
  );
  assert.ok(planSources(plan).first >= 40);
});
