"use client";

import { useEffect, useState } from "react";

import { useCardEntrances } from "@/features/motion/card-entrances";
import { useDrawAndParallax } from "@/features/motion/draw-parallax";
import { useHeadingReveals } from "@/features/motion/heading-reveals";
import { useHeroMotion } from "@/features/motion/hero-motion";
import { armScrollTriggerLayoutRefresh, isCoarsePointer, registerGsapPlugins } from "@/features/motion/motion-config";

function DeferredHomeScenes() {
  useHeadingReveals();
  useDrawAndParallax();
  useCardEntrances();
  return null;
}

/**
 * Homepage motion orchestrator — hero runs immediately; heavier scroll scenes
 * wait for window `load` (or a 2s fallback) so first paint isn't competing.
 * Coarse pointer: skip DeferredHomeScenes entirely.
 */
export function HomeMotion() {
  useHeroMotion();
  const [defer, setDefer] = useState(false);

  useEffect(() => {
    registerGsapPlugins();
    document.documentElement.classList.add("home-motion-ready");

    const disposeRefresh = armScrollTriggerLayoutRefresh();

    // Touch / coarse: don't mount heavy scroll scenes at all.
    if (isCoarsePointer()) {
      return () => {
        document.documentElement.classList.remove("home-motion-ready");
        disposeRefresh();
      };
    }

    let timeoutId = 0;
    let armed = false;
    const arm = () => {
      if (armed) return;
      armed = true;
      setDefer(true);
    };

    const onLoad = () => arm();
    if (document.readyState === "complete") {
      arm();
    } else {
      window.addEventListener("load", onLoad, { once: true });
      timeoutId = window.setTimeout(arm, 2000);
    }

    return () => {
      window.removeEventListener("load", onLoad);
      document.documentElement.classList.remove("home-motion-ready");
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      disposeRefresh();
    };
  }, []);

  return defer ? <DeferredHomeScenes /> : null;
}
