import { heroVideoMobileSrc, heroVideoPosterSrc, heroVideoSrc } from "@/constants/brand";

/** Desktop, mobile and poster files of one stacked-alpha hero render. */
export type HeroVideoSet = {
  src: string;
  mobileSrc: string;
  posterSrc: string;
};

export const DEFAULT_HERO_VIDEO: HeroVideoSet = {
  src: heroVideoSrc,
  mobileSrc: heroVideoMobileSrc,
  posterSrc: heroVideoPosterSrc,
};

const STACKED_VIDEO = /-alpha-(?:hd|sd)\.mp4$/i;
const RENDER_SUFFIX = /-alpha-(?:hd|sd)\.mp4$|-alpha-poster\.webp$/i;

function pathOf(src: string): string {
  return (src.split(/[?#]/)[0] ?? src).trim();
}

/** Stacked-alpha MP4 (colour over matte) written by the Backend hero pipeline. */
export function isStackedAlphaVideoSrc(src: string | null | undefined): boolean {
  return STACKED_VIDEO.test(pathOf(String(src ?? "")));
}

function renderStem(src: string): string | null {
  const path = pathOf(src);
  return RENDER_SUFFIX.test(path) ? path.replace(RENDER_SUFFIX, "") : null;
}

/**
 * The hero only ever plays one render: a stored desktop file that is a stacked-alpha
 * cutout, with the mobile file and poster rendered alongside it. Anything else (a plain
 * clip still waiting for conversion, a cleared field) shows the bundled default set.
 */
export function resolveHeroVideoSet(
  stored: { src?: string | null; mobileSrc?: string | null; posterSrc?: string | null },
  fallback: HeroVideoSet = DEFAULT_HERO_VIDEO,
): HeroVideoSet {
  const src = pathOf(String(stored.src ?? ""));
  if (!isStackedAlphaVideoSrc(src)) {
    // Still-image hero. Keep a real photo poster; ignore leftover alpha-poster paths from old renders.
    const storedPoster = pathOf(String(stored.posterSrc ?? ""));
    const posterOk =
      Boolean(storedPoster) &&
      !RENDER_SUFFIX.test(storedPoster) &&
      /\.(png|webp|jpe?g)$/i.test(storedPoster);
    return {
      src: "",
      mobileSrc: "",
      posterSrc: posterOk ? storedPoster : pathOf(fallback.posterSrc) || pathOf(heroVideoPosterSrc),
    };
  }
  const stem = renderStem(src);
  const mobileSrc = String(stored.mobileSrc ?? "").trim();
  const posterSrc = String(stored.posterSrc ?? "").trim();
  return {
    src,
    mobileSrc: isStackedAlphaVideoSrc(mobileSrc) && renderStem(mobileSrc) === stem ? mobileSrc : `${stem}-alpha-sd.mp4`,
    posterSrc: renderStem(posterSrc) === stem ? posterSrc : `${stem}-alpha-poster.webp`,
  };
}
