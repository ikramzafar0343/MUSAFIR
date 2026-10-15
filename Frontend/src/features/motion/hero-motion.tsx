"use client";

import { useEffect } from "react";

import {
  HERO_COMPACT_MQ,
  HERO_DESKTOP_MQ,
  isHeroDesktopLayout,
  notifyHeroCompact,
  notifyHeroIntro,
  shouldPlayHeroIntro,
  writeHeroSessionSeen,
} from "@/features/motion/hero-wordmark-events";
import {
  gsap,
  registerGsapPlugins,
  ScrollTrigger,
} from "@/features/motion/motion-config";

const FONT_DEADLINE_MS = 800;
const SCROLL_DISTANCE = 700;
const PIN_DISTANCE = 400;
const INTERRUPT_SCROLL_PX = 8;
const SCROLL_KEYS = new Set([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"]);

type HeroNodes = {
  root: HTMLElement;
  hero: HTMLElement;
  scrollWrap: HTMLElement;
  panel: HTMLElement;
  scene: HTMLElement;
  backdrop: HTMLElement | null;
  introAnchor: HTMLElement | null;
  introMotion: HTMLElement | null;
  introType: HTMLElement | null;
  wordmarkScroll: HTMLElement | null;
  wordmarkReveal: HTMLElement | null;
  subjectReveal: HTMLElement | null;
};

function queryHero(root: HTMLElement): HeroNodes | null {
  const hero = root.querySelector(".home-hero");
  const scrollWrap = root.querySelector(".home-hero-scroll");
  const panel = root.querySelector(".home-hero-panel");
  const scene = root.querySelector(".home-hero-scene");
  if (
    !(hero instanceof HTMLElement) ||
    !(scrollWrap instanceof HTMLElement) ||
    !(panel instanceof HTMLElement) ||
    !(scene instanceof HTMLElement)
  ) {
    return null;
  }
  const backdrop = root.querySelector(".home-hero-backdrop-intro");
  const introAnchor = root.querySelector(".home-hero-intro-anchor");
  const introMotion = root.querySelector(".home-hero-intro-motion");
  const introType = root.querySelector(".home-hero-intro-type");
  const wordmarkScroll = root.querySelector(".home-hero-wordmark-scroll");
  const wordmarkReveal = root.querySelector(".home-hero-wordmark-reveal");
  const subjectReveal = root.querySelector(".home-hero-subject-reveal");
  return {
    root,
    hero,
    scrollWrap,
    panel,
    scene,
    backdrop: backdrop instanceof HTMLElement ? backdrop : null,
    introAnchor: introAnchor instanceof HTMLElement ? introAnchor : null,
    introMotion: introMotion instanceof HTMLElement ? introMotion : null,
    introType: introType instanceof HTMLElement ? introType : null,
    wordmarkScroll: wordmarkScroll instanceof HTMLElement ? wordmarkScroll : null,
    wordmarkReveal: wordmarkReveal instanceof HTMLElement ? wordmarkReveal : null,
    subjectReveal: subjectReveal instanceof HTMLElement ? subjectReveal : null,
  };
}

function waitForFonts(ms: number): Promise<"ready" | "timeout"> {
  if (!document.fonts) {
    return Promise.resolve("ready");
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: "ready" | "timeout") => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      resolve(value);
    };
    const timer = window.setTimeout(() => finish("timeout"), ms);
    void document.fonts.ready.then(() => finish("ready"));
  });
}

function hideIntro(nodes: HeroNodes): void {
  if (nodes.introAnchor) {
    nodes.introAnchor.classList.remove("is-active");
    gsap.set(nodes.introAnchor, { autoAlpha: 0 });
  }
  if (nodes.introMotion) {
    gsap.set(nodes.introMotion, { clearProps: "willChange" });
  }
  if (nodes.introType) {
    gsap.set(nodes.introType, { clearProps: "willChange" });
  }
  if (nodes.backdrop) {
    gsap.set(nodes.backdrop, { clearProps: "willChange" });
  }
}

function settleEntrance(nodes: HeroNodes): void {
  // Panel owns the settled olive fill; hide the intro-only backdrop copy.
  if (nodes.backdrop) {
    gsap.set(nodes.backdrop, {
      scale: 1,
      opacity: 0,
      visibility: "hidden",
      clearProps: "willChange",
    });
  }
  if (nodes.wordmarkReveal) {
    gsap.set(nodes.wordmarkReveal, { y: 0, opacity: 1, skewY: 0 });
  }
  if (nodes.subjectReveal) {
    gsap.set(nodes.subjectReveal, { opacity: 1 });
  }
  hideIntro(nodes);
  notifyHeroIntro(false);
}

function clearFeatureStyles(nodes: HeroNodes): void {
  settleEntrance(nodes);
  resetProgressStyles(nodes);
  if (nodes.backdrop) {
    gsap.set(nodes.backdrop, { clearProps: "transform,opacity,scale,willChange" });
  }
  if (nodes.introMotion) {
    gsap.set(nodes.introMotion, { clearProps: "transform,opacity,scale,y,willChange" });
  }
  if (nodes.introType) {
    gsap.set(nodes.introType, { clearProps: "transform,opacity,scale,y,skewY,willChange" });
  }
  if (nodes.introAnchor) {
    gsap.set(nodes.introAnchor, { clearProps: "autoAlpha,opacity,visibility" });
  }
  if (nodes.wordmarkReveal) {
    gsap.set(nodes.wordmarkReveal, { clearProps: "transform,opacity,y,skewY" });
  }
  if (nodes.subjectReveal) {
    gsap.set(nodes.subjectReveal, { clearProps: "opacity" });
  }
  if (nodes.wordmarkScroll) {
    gsap.set(nodes.wordmarkScroll, { clearProps: "transform,opacity,y,scale" });
  }
  gsap.set(nodes.scene, { clearProps: "transform,opacity,scale" });
  gsap.set(nodes.panel, { clearProps: "transform,opacity,scale" });
  document.documentElement.classList.remove("hero-intro-active");
  notifyHeroIntro(false);
}

function applyHeroProgress(nodes: HeroNodes, rawProgress: number, compactRef: { value: boolean }): void {
  const p = Math.max(0, Math.min(1, rawProgress));
  const q = Math.max(0, p - 0.5);
  if (nodes.wordmarkScroll) {
    gsap.set(nodes.wordmarkScroll, {
      y: 50 * p,
      scale: 1 - 0.5 * p,
      opacity: Math.max(0, 1 - 2 * p),
      transformOrigin: "50% 0%",
    });
  }
  gsap.set(nodes.scene, {
    scale: 1 - 0.5 * q,
    opacity: 1 - 0.2 * q,
    transformOrigin: "50% 100%",
  });
  const compact = p >= 0.5;
  if (compact !== compactRef.value) {
    compactRef.value = compact;
    notifyHeroCompact(compact);
  }
}

function resetProgressStyles(nodes: HeroNodes): void {
  if (nodes.wordmarkScroll) {
    gsap.set(nodes.wordmarkScroll, { y: 0, scale: 1, opacity: 1, transformOrigin: "50% 0%" });
  }
  gsap.set(nodes.scene, { scale: 1, opacity: 1, transformOrigin: "50% 100%" });
}

function attachInterrupts(onSettle: () => void): () => void {
  const onScroll = () => {
    if (window.scrollY > INTERRUPT_SCROLL_PX) {
      onSettle();
    }
  };
  const onWheel = () => onSettle();
  const onTouch = () => onSettle();
  const onKey = (event: KeyboardEvent) => {
    if (SCROLL_KEYS.has(event.key)) {
      onSettle();
    }
  };
  const onPointer = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    if (target.closest("[data-musafir-header] a, [data-musafir-header] button, .home-hero-cta, .home-hero-cta-wrap")) {
      onSettle();
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("touchmove", onTouch, { passive: true });
  window.addEventListener("keydown", onKey);
  document.addEventListener("pointerdown", onPointer, true);
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchmove", onTouch);
    window.removeEventListener("keydown", onKey);
    document.removeEventListener("pointerdown", onPointer, true);
  };
}

function createIntroTimeline(nodes: HeroNodes): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  if (nodes.backdrop) {
    tl.fromTo(
      nodes.backdrop,
      { scale: 0.2, opacity: 0, transformOrigin: "50% 50%" },
      { scale: 0.3, opacity: 1, duration: 1.2, ease: "power1.inOut", immediateRender: false },
      0,
    );
    tl.to(nodes.backdrop, { scale: 1, duration: 1.2, ease: "power4.out" }, 1.9);
  }
  if (nodes.introMotion) {
    tl.fromTo(
      nodes.introMotion,
      { y: 50, scale: 0.9, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: "power2.out", immediateRender: false },
      0.4,
    );
    tl.to(nodes.introMotion, { opacity: 0, scale: 0.9, duration: 0.6, ease: "power1.inOut" }, 2.0);
  }
  if (nodes.introType) {
    tl.fromTo(
      nodes.introType,
      { y: 200, skewY: 15, opacity: 0 },
      { y: 0, skewY: 0, opacity: 1, duration: 0.8, ease: "power2.out", immediateRender: false },
      0.6,
    );
    tl.to(nodes.introType, { opacity: 0, scale: 0.85, duration: 0.7, ease: "power4.out" }, 1.4);
  }
  if (nodes.wordmarkReveal) {
    tl.fromTo(
      nodes.wordmarkReveal,
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "revealEase", immediateRender: false },
      2.4,
    );
  }
  if (nodes.subjectReveal) {
    tl.fromTo(
      nodes.subjectReveal,
      { opacity: 0 },
      { opacity: 1, duration: 0.65, ease: "power2.out", immediateRender: false },
      2.4,
    );
  }
  return tl;
}

function armIntro(nodes: HeroNodes): void {
  nodes.introAnchor?.classList.add("is-active");
  if (nodes.introAnchor) {
    gsap.set(nodes.introAnchor, { autoAlpha: 1 });
  }
  if (nodes.backdrop) {
    gsap.set(nodes.backdrop, {
      scale: 0.2,
      opacity: 0,
      visibility: "visible",
      transformOrigin: "50% 50%",
      willChange: "transform, opacity",
    });
  }
  if (nodes.introMotion) {
    gsap.set(nodes.introMotion, { y: 50, scale: 0.9, opacity: 0, willChange: "transform, opacity" });
  }
  if (nodes.introType) {
    gsap.set(nodes.introType, { y: 200, skewY: 15, opacity: 0, willChange: "transform, opacity" });
  }
  if (nodes.wordmarkReveal) {
    gsap.set(nodes.wordmarkReveal, { y: -30, opacity: 0 });
  }
  if (nodes.subjectReveal) {
    gsap.set(nodes.subjectReveal, { opacity: 0 });
  }
  notifyHeroIntro(true);
}

function bindDebugTimeline(tl: gsap.core.Timeline): () => void {
  if (process.env.NODE_ENV !== "development") {
    return () => undefined;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("heroDebug")) {
      return () => undefined;
    }
    (window as Window & { __musafirHeroTl?: gsap.core.Timeline }).__musafirHeroTl = tl;
    return () => {
      const tagged = window as Window & { __musafirHeroTl?: gsap.core.Timeline };
      if (tagged.__musafirHeroTl === tl) {
        delete tagged.__musafirHeroTl;
      }
    };
  } catch {
    return () => undefined;
  }
}

function setupProgress(nodes: HeroNodes, compactRef: { value: boolean }, withPin: boolean): ScrollTrigger[] {
  const triggers: ScrollTrigger[] = [];
  if (withPin) {
    triggers.push(
      ScrollTrigger.create({
        trigger: nodes.hero,
        start: "top top",
        end: `+=${PIN_DISTANCE}`,
        pin: nodes.scrollWrap,
        pinSpacing: true,
        anticipatePin: 1,
      }),
    );
  }
  triggers.push(
    ScrollTrigger.create({
      trigger: nodes.hero,
      start: "top top",
      end: `+=${SCROLL_DISTANCE}`,
      onUpdate: (self) => applyHeroProgress(nodes, self.progress, compactRef),
      onRefresh: (self) => applyHeroProgress(nodes, self.progress, compactRef),
    }),
  );
  return triggers;
}

/**
 * Three-layer hero wordmark: temporary intro, progress-driven H1, compact header notify.
 */
export function useHeroMotion() {
  useEffect(() => {
    registerGsapPlugins();
    const root = document.querySelector(".home-flow");
    if (!(root instanceof HTMLElement)) {
      return;
    }

    const nodes = queryHero(root);
    if (!nodes) {
      root.classList.add("is-hero-ready");
      return;
    }

    document.documentElement.classList.add("home-motion-ready");

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      settleEntrance(nodes);
      resetProgressStyles(nodes);
      root.classList.add("is-hero-ready");
      const compactRef = { value: false };
      const onScroll = () => {
        if (!isHeroDesktopLayout()) {
          return;
        }
        const p = Math.max(0, Math.min(1, window.scrollY / SCROLL_DISTANCE));
        const compact = p >= 0.5;
        if (compact !== compactRef.value) {
          compactRef.value = compact;
          notifyHeroCompact(compact);
        }
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        clearFeatureStyles(nodes);
      };
    });

    mm.add(HERO_COMPACT_MQ, () => {
      notifyHeroCompact(false);
      settleEntrance(nodes);
      resetProgressStyles(nodes);

      let removeInterrupts: (() => void) | undefined;
      let restrainedTween: gsap.core.Tween | undefined;
      const playRestrained = shouldPlayHeroIntro();
      if (playRestrained && nodes.wordmarkReveal) {
        gsap.set(nodes.wordmarkReveal, { y: 24, skewY: 4, opacity: 0 });
        restrainedTween = gsap.to(nodes.wordmarkReveal, {
          y: 0,
          skewY: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => {
            writeHeroSessionSeen();
            root.classList.add("is-hero-ready");
          },
        });
        const settle = () => {
          restrainedTween?.progress(1);
          writeHeroSessionSeen();
          root.classList.add("is-hero-ready");
          removeInterrupts?.();
        };
        removeInterrupts = attachInterrupts(settle);
      } else {
        root.classList.add("is-hero-ready");
        if (!playRestrained) {
          writeHeroSessionSeen();
        }
      }

      return () => {
        removeInterrupts?.();
        restrainedTween?.kill();
        clearFeatureStyles(nodes);
      };
    });

    mm.add(HERO_DESKTOP_MQ, () => {
      const compactRef = { value: false };
      let active = true;
      let settled = false;
      let removeInterrupts: (() => void) | undefined;
      let clearDebug: (() => void) | undefined;
      let settleRaf = 0;
      const introTl = createIntroTimeline(nodes);
      // Lenis runs on the same desktop fine-pointer path — pin + smooth scroll rubber-bands.
      const progressTriggers = setupProgress(nodes, compactRef, false);
      const currentProgress = () => progressTriggers[progressTriggers.length - 1]?.progress ?? 0;

      const syncProgress = () => {
        ScrollTrigger.refresh();
        applyHeroProgress(nodes, currentProgress(), compactRef);
      };

      const settleIntro = () => {
        if (settled) {
          return;
        }
        settled = true;
        introTl.progress(1).pause();
        settleEntrance(nodes);
        applyHeroProgress(nodes, currentProgress(), compactRef);
        window.cancelAnimationFrame(settleRaf);
        settleRaf = window.requestAnimationFrame(() => {
          if (!active) {
            return;
          }
          applyHeroProgress(nodes, currentProgress(), compactRef);
        });
        writeHeroSessionSeen();
        root.classList.add("is-hero-ready");
        removeInterrupts?.();
        document.documentElement.classList.remove("hero-intro-active");
      };

      // Refresh first so restored scrollY maps to the correct progress before any header notify.
      syncProgress();

      if (!shouldPlayHeroIntro()) {
        settleEntrance(nodes);
        syncProgress();
        writeHeroSessionSeen();
        root.classList.add("is-hero-ready");
      } else {
        void waitForFonts(FONT_DEADLINE_MS)
          .then((fonts) => {
            if (!active) {
              return;
            }
            if (window.scrollY > INTERRUPT_SCROLL_PX || fonts === "timeout") {
              settleEntrance(nodes);
              syncProgress();
              writeHeroSessionSeen();
              root.classList.add("is-hero-ready");
              return;
            }

            document.documentElement.classList.add("hero-intro-active");
            armIntro(nodes);
            introTl.eventCallback("onComplete", () => {
              settled = true;
              settleEntrance(nodes);
              applyHeroProgress(nodes, currentProgress(), compactRef);
              writeHeroSessionSeen();
              root.classList.add("is-hero-ready");
              document.documentElement.classList.remove("hero-intro-active");
              removeInterrupts?.();
            });
            clearDebug = bindDebugTimeline(introTl);
            removeInterrupts = attachInterrupts(settleIntro);
            introTl.play(0);
            ScrollTrigger.refresh();
          })
          .catch(() => {
            if (!active) {
              return;
            }
            settleEntrance(nodes);
            syncProgress();
            root.classList.add("is-hero-ready");
            document.documentElement.classList.remove("hero-intro-active");
          });
      }

      return () => {
        active = false;
        window.cancelAnimationFrame(settleRaf);
        removeInterrupts?.();
        clearDebug?.();
        introTl.kill();
        progressTriggers.forEach((trigger) => trigger.kill());
        clearFeatureStyles(nodes);
      };
    });

    return () => {
      mm.revert();
    };
  }, []);
}
