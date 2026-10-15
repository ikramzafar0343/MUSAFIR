type ScrollLockListener = (locked: boolean) => void;

let lockCount = 0;
let savedScrollY = 0;
let previousBodyPosition = "";
let previousBodyTop = "";
let previousBodyWidth = "";
let previousBodyOverflow = "";
let previousHtmlOverflow = "";

const listeners = new Set<ScrollLockListener>();

function notify(locked: boolean): void {
  for (const listener of listeners) {
    listener(locked);
  }
}

function applyLock(): void {
  savedScrollY = window.scrollY;
  previousBodyPosition = document.body.style.position;
  previousBodyTop = document.body.style.top;
  previousBodyWidth = document.body.style.width;
  previousBodyOverflow = document.body.style.overflow;
  previousHtmlOverflow = document.documentElement.style.overflow;

  document.body.style.position = "fixed";
  document.body.style.top = `-${savedScrollY}px`;
  document.body.style.width = "100%";
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  notify(true);
}

function releaseLock(): void {
  document.body.style.position = previousBodyPosition;
  document.body.style.top = previousBodyTop;
  document.body.style.width = previousBodyWidth;
  document.body.style.overflow = previousBodyOverflow;
  document.documentElement.style.overflow = previousHtmlOverflow;
  window.scrollTo(0, savedScrollY);
  notify(false);
}

/** Ref-counted, iOS-safe body scroll lock. Returns an unlock function. */
export function lockScroll(): () => void {
  if (typeof document === "undefined") {
    return () => undefined;
  }

  lockCount += 1;
  if (lockCount === 1) {
    applyLock();
  }

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    if (lockCount <= 0) {
      return;
    }
    lockCount -= 1;
    if (lockCount === 0) {
      releaseLock();
    }
  };
}

/**
 * Subscribe to lock state changes (e.g. Lenis stop/start).
 * Immediately invokes with the current locked state.
 */
export function onScrollLockChange(listener: ScrollLockListener): () => void {
  listeners.add(listener);
  listener(lockCount > 0);
  return () => {
    listeners.delete(listener);
  };
}

/** Register a callback invoked when scroll becomes locked (0→1). */
export function pauseSmoothScroll(onPause: () => void): () => void {
  return onScrollLockChange((locked) => {
    if (locked) {
      onPause();
    }
  });
}

/** Register a callback invoked when scroll becomes unlocked (1→0). */
export function resumeSmoothScroll(onResume: () => void): () => void {
  return onScrollLockChange((locked) => {
    if (!locked) {
      onResume();
    }
  });
}

export function isScrollLocked(): boolean {
  return lockCount > 0;
}
