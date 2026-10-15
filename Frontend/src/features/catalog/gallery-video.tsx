"use client";

import { useEffect, useId, useRef, useState } from "react";

type Slot = {
  id: string;
  ratio: number;
  play: () => void;
  pause: () => void;
};

const slots = new Map<string, Slot>();
let activeId: string | null = null;
let raf = 0;

function electLeader() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    let best: Slot | null = null;
    for (const slot of slots.values()) {
      if (slot.ratio < 0.35) continue;
      if (!best || slot.ratio > best.ratio) best = slot;
    }
    const nextId = best?.id ?? null;
    if (nextId === activeId) {
      if (best) best.play();
      return;
    }
    for (const slot of slots.values()) {
      if (slot.id === nextId) slot.play();
      else slot.pause();
    }
    activeId = nextId;
  });
}

/**
 * Muted looping gallery clip — loads only near the viewport and yields the
 * decoder to a single leader so the homepage does not stall with many videos.
 */
export function GalleryVideo({
  src,
  label,
  className,
  poster,
}: {
  src: string;
  label: string;
  className?: string;
  poster?: string;
}) {
  const id = useId();
  const ref = useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let near = false;
    let unloadTimer = 0;

    const detachSource = () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      setArmed(false);
      setReady(false);
    };

    const attachSource = () => {
      if (video.getAttribute("src") === src) return;
      video.src = src;
      video.load();
      setArmed(true);
    };

    const playSafe = () => {
      if (reduced || document.visibilityState !== "visible") return;
      if (!video.getAttribute("src")) attachSource();
      const run = () => {
        void video.play().catch(() => undefined);
      };
      if (video.readyState >= 2) run();
      else video.addEventListener("loadeddata", run, { once: true });
    };

    const pauseSafe = () => {
      video.pause();
    };

    slots.set(id, {
      id,
      ratio: 0,
      play: playSafe,
      pause: pauseSafe,
    });

    const nearIo = new IntersectionObserver(
      (entries) => {
        near = entries.some((entry) => entry.isIntersecting);
        window.clearTimeout(unloadTimer);
        if (near) {
          if (!reduced) attachSource();
          return;
        }
        // Free decoder memory shortly after leaving the viewport.
        unloadTimer = window.setTimeout(() => {
          const slot = slots.get(id);
          if (slot) slot.ratio = 0;
          if (activeId === id) activeId = null;
          detachSource();
          electLeader();
        }, 900);
      },
      { rootMargin: "120px 0px", threshold: 0 },
    );

    const playIo = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const slot = slots.get(id);
        if (!slot) return;
        slot.ratio = entry?.isIntersecting ? entry.intersectionRatio : 0;
        electLeader();
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: "0px" },
    );

    nearIo.observe(video);
    playIo.observe(video);

    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        pauseSafe();
        return;
      }
      electLeader();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onReady = () => setReady(true);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("playing", onReady);

    return () => {
      window.clearTimeout(unloadTimer);
      nearIo.disconnect();
      playIo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("playing", onReady);
      slots.delete(id);
      if (activeId === id) activeId = null;
      detachSource();
      electLeader();
    };
  }, [id, src]);

  return (
    <video
      ref={ref}
      className={className}
      muted
      loop
      playsInline
      preload="none"
      poster={poster || undefined}
      disablePictureInPicture
      disableRemotePlayback
      controls={false}
      aria-label={label}
      data-armed={armed ? "1" : "0"}
      data-ready={ready ? "1" : "0"}
      style={{ opacity: ready ? 1 : 0.35 }}
    />
  );
}
