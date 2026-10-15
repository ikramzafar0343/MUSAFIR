/**
 * Plans how the hero cutout loops. Two shapes:
 *
 * - "cut": a segment whose last frame leads naturally back into its first (pose and
 *   silhouette match), with a short dissolve over the seam. The dissolve blends the tail
 *   into the frames just before the start, so frame 0 stays an untouched frame the
 *   poster can match exactly.
 * - "bounce": when no seam is clean enough (the motion never comes back to where it
 *   started), a calm stretch plays forward and back on a cosine ease. Speed reaches zero
 *   at both turns, so there is no seam at all.
 *
 * Frames where the subject is clipped by the frame edge are never used.
 */

export type LoopPlan =
  | { kind: "cut"; start: number; end: number; crossfade: number }
  | { kind: "bounce"; from: number; to: number; frames: number };

/** One output frame as a weighted mix of source frames. */
export type FrameMix = ReadonlyArray<{ source: number; weight: number }>;

export type LoopSearch = {
  frameCount: number;
  fps: number;
  /** Frames the loop may use (subject fully in shot). */
  usable: readonly boolean[];
  /** Appearance distance between two frames; 0 means identical. */
  distance: (a: number, b: number) => number;
  crossfade: number;
};

/** A cut seam this many typical frame-to-frame steps or less reads as continuous motion. */
const CUT_SEAM_LIMIT = 2.5;
const CUT_MIN_SECONDS = 1.5;
const CUT_MAX_SECONDS = 5;
const BOUNCE_MIN_SECONDS = 0.75;
const BOUNCE_MAX_SECONDS = 2.5;
/** Peak playback speed of a bounce, in source frames per output frame. */
const BOUNCE_PEAK_SPEED = 0.85;

function median(values: number[]): number {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return sorted[sorted.length >> 1] ?? 0;
}

export function planLoop(search: LoopSearch): LoopPlan {
  const { frameCount: total, usable } = search;
  const memo = new Map<number, number>();
  const distance = (a: number, b: number) => {
    const key = a * total + b;
    let value = memo.get(key);
    if (value === undefined) {
      value = search.distance(a, b);
      memo.set(key, value);
    }
    return value;
  };

  const speeds: number[] = [];
  const usableSteps: number[] = [];
  for (let k = 0; k + 1 < total; k += 1) {
    const step = distance(k, k + 1);
    speeds.push(step);
    if (usable[k] && usable[k + 1]) {
      usableSteps.push(step);
    }
  }
  const typicalStep = Math.max(1e-6, median(usableSteps.length > 0 ? usableSteps : speeds));

  const cut = findCut(search, distance, typicalStep, true);
  if (cut && cut.seam <= CUT_SEAM_LIMIT * typicalStep) {
    return cut.plan;
  }
  const bounce = findBounce(search, speeds, typicalStep);
  if (bounce) {
    return bounce;
  }
  const fallback = cut ?? findCut(search, distance, typicalStep, false);
  if (fallback) {
    return fallback.plan;
  }
  return { kind: "cut", start: 0, end: total, crossfade: 0 };
}

function findCut(
  search: LoopSearch,
  distance: (a: number, b: number) => number,
  typicalStep: number,
  strict: boolean,
): { plan: LoopPlan; seam: number } | null {
  const { frameCount: total, fps, usable } = search;
  const fade = Math.max(0, Math.floor(search.crossfade));
  const minLength = Math.max(4, Math.round(CUT_MIN_SECONDS * fps));
  const maxLength = Math.max(minLength, Math.round(CUT_MAX_SECONDS * fps));
  const blocked = new Int32Array(total + 1);
  for (let k = 0; k < total; k += 1) {
    blocked[k + 1] = (blocked[k] ?? 0) + (usable[k] ? 0 : 1);
  }

  let best: { plan: LoopPlan; seam: number; score: number } | null = null;
  for (let start = fade + 1; start + minLength + 1 < total; start += 1) {
    for (let length = minLength; length <= maxLength; length += 1) {
      const end = start + length;
      if (end + 1 >= total) break;
      const unusable = (blocked[end] ?? 0) - (blocked[start - fade] ?? 0);
      if (strict && unusable > 0) break;
      const seam = (distance(start, end) + 0.5 * (distance(start - 1, end - 1) + distance(start + 1, end + 1))) / 2;
      const seconds = length / fps;
      const lengthPenalty = 0.8 * Math.max(0, 2.5 - seconds) + 0.25 * Math.max(0, seconds - 4);
      const score = seam + typicalStep * (lengthPenalty + 10 * unusable);
      if (!best || score < best.score) {
        best = { plan: { kind: "cut", start, end, crossfade: fade }, seam, score };
      }
    }
  }
  return best ? { plan: best.plan, seam: best.seam } : null;
}

/**
 * The usable stretch with the most motion whose ends are both slow (so the turns stay
 * clean), starting from the calmer end.
 */
function findBounce(search: LoopSearch, speeds: readonly number[], typicalStep: number): LoopPlan | null {
  const { frameCount: total, fps, usable } = search;
  const minLength = Math.max(2, Math.round(BOUNCE_MIN_SECONDS * fps));
  const maxLength = Math.max(minLength, Math.round(BOUNCE_MAX_SECONDS * fps));
  for (const slack of [1.25, 2, 3]) {
    const limit = typicalStep * slack;
    let best: { lo: number; hi: number; travel: number } | null = null;
    for (let lo = 0; lo < total; lo += 1) {
      if (!usable[lo] || (speeds[lo] ?? Infinity) > limit) continue;
      let travel = 0;
      for (let hi = lo + 1; hi < total && hi - lo <= maxLength; hi += 1) {
        if (!usable[hi]) break;
        const arriving = speeds[hi - 1] ?? Infinity;
        travel += arriving;
        if (hi - lo < minLength || arriving > limit) continue;
        if (!best || travel > best.travel) {
          best = { lo, hi, travel };
        }
      }
    }
    if (best) {
      const calmAtStart = (speeds[best.lo] ?? 0) <= (speeds[best.hi - 1] ?? 0);
      const from = calmAtStart ? best.lo : best.hi;
      const to = calmAtStart ? best.hi : best.lo;
      const half = Math.max(2, Math.ceil((Math.abs(to - from) * Math.PI) / (2 * BOUNCE_PEAK_SPEED)));
      return { kind: "bounce", from, to, frames: half * 2 };
    }
  }
  return null;
}

/** Inclusive range of source frames the plan reads. */
export function planSources(plan: LoopPlan): { first: number; last: number } {
  if (plan.kind === "cut") {
    return { first: plan.start - plan.crossfade, last: plan.end - 1 };
  }
  return { first: Math.min(plan.from, plan.to), last: Math.max(plan.from, plan.to) };
}

/** The output frames of the loop, in order. Frame 0 is always a single source frame. */
export function planFrames(plan: LoopPlan): FrameMix[] {
  const frames: FrameMix[] = [];
  if (plan.kind === "cut") {
    const tailStart = plan.end - plan.crossfade;
    for (let k = plan.start; k < plan.end; k += 1) {
      if (k < tailStart) {
        frames.push([{ source: k, weight: 1 }]);
        continue;
      }
      const t = (k - tailStart + 1) / (plan.crossfade + 1);
      frames.push([
        { source: k, weight: 1 - t },
        { source: plan.start - plan.crossfade + (k - tailStart), weight: t },
      ]);
    }
    return frames;
  }

  const lowest = Math.min(plan.from, plan.to);
  const highest = Math.max(plan.from, plan.to);
  for (let i = 0; i < plan.frames; i += 1) {
    const position = plan.from + ((plan.to - plan.from) * (1 - Math.cos((2 * Math.PI * i) / plan.frames))) / 2;
    const lo = Math.min(highest, Math.max(lowest, Math.floor(position + 1e-9)));
    const weight = position - lo;
    if (weight < 1e-3 || lo >= highest) {
      frames.push([{ source: lo, weight: 1 }]);
    } else if (weight > 1 - 1e-3) {
      frames.push([{ source: lo + 1, weight: 1 }]);
    } else {
      frames.push([
        { source: lo, weight: 1 - weight },
        { source: lo + 1, weight },
      ]);
    }
  }
  return frames;
}
