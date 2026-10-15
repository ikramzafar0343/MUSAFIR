export const HERO_COMPACT_EVENT = "musafir:hero-compact";
export const HERO_INTRO_EVENT = "musafir:hero-intro";
export const HERO_WORDMARK_SESSION_KEY = "musafir:hero-wordmark:v1:seen";

export const HERO_DESKTOP_MQ =
  "(min-width: 1024px) and (min-height: 600px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

export const HERO_DESKTOP_LAYOUT_MQ = "(min-width: 1024px) and (min-height: 600px) and (pointer: fine)";

export const HERO_COMPACT_MQ = [
  "(prefers-reduced-motion: no-preference) and (max-width: 1023px)",
  "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (max-height: 599px)",
  "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 600px) and (pointer: coarse)",
].join(", ");

export type HeroCompactDetail = {
  compact: boolean;
};

export type HeroIntroDetail = {
  active: boolean;
};

export function readHeroSessionSeen(): boolean {
  try {
    return sessionStorage.getItem(HERO_WORDMARK_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeHeroSessionSeen(): void {
  try {
    sessionStorage.setItem(HERO_WORDMARK_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** True for a full document reload — intro should replay (VOLDOG reload behavior). */
export function isDocumentReload(): boolean {
  if (typeof window === "undefined" || typeof performance === "undefined") {
    return false;
  }
  try {
    const entries = performance.getEntriesByType("navigation");
    const nav = entries[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === "reload") {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Soft client navigations keep the session skip; a browser refresh replays the intro.
 * Nonzero restored scroll still skips so back/forward does not fight scroll position.
 */
export function shouldPlayHeroIntro(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (window.scrollY > 8) {
    return false;
  }
  if (isDocumentReload()) {
    return true;
  }
  return !readHeroSessionSeen();
}

let lastCompact: boolean | null = null;

export function readHeroCompact(): boolean | null {
  return lastCompact;
}

export function notifyHeroCompact(compact: boolean): void {
  if (lastCompact === compact) {
    return;
  }
  lastCompact = compact;
  window.dispatchEvent(new CustomEvent<HeroCompactDetail>(HERO_COMPACT_EVENT, { detail: { compact } }));
}

export function notifyHeroIntro(active: boolean): void {
  window.dispatchEvent(new CustomEvent<HeroIntroDetail>(HERO_INTRO_EVENT, { detail: { active } }));
}

export function isHeroDesktopLayout(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(HERO_DESKTOP_LAYOUT_MQ).matches;
}
