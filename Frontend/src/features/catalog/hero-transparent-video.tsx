"use client";

import { useRef } from "react";

import { CmsImage } from "@/features/media/cms-image";
import { useStackedAlphaPlayer } from "@/features/media/stacked-alpha-player";

type HeroTransparentVideoProps = {
  src: string;
  mobileSrc: string;
  posterSrc: string;
  className?: string;
};

/**
 * Transparent hero cutout. The poster is the loop's first frame and paints first (LCP);
 * the stacked-alpha video takes over on a WebGL canvas once its first frame is drawn.
 */
export function HeroTransparentVideo({ src, mobileSrc, posterSrc, className = "" }: HeroTransparentVideoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useStackedAlphaPlayer(src ? { src, mobileSrc } : null, {
    video: videoRef,
    canvas: canvasRef,
    viewport: rootRef,
  });

  if (!src && !posterSrc) return null;

  return (
    <div ref={rootRef} className={`home-hero-subject ${className}`.trim()}>
      <div className="home-hero-subject-reveal">
        <div className="home-hero-subject-motion">
          <CmsImage
            src={posterSrc}
            alt=""
            fill
            sizes="(max-width: 767px) 88vw, 52vh"
            preload
            className={`home-hero-poster${live ? " is-hidden" : ""}`}
          />
          <video ref={videoRef} className="home-hero-video-source" muted playsInline loop preload="auto" aria-hidden="true" />
          <canvas ref={canvasRef} className={`home-hero-video-canvas${live ? " is-live" : ""}`} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
