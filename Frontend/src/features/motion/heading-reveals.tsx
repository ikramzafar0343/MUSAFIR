"use client";

import gsap from "gsap";
import { useEffect } from "react";

import {
  isCoarsePointer,
  isMobileViewport,
  prefersReducedMotion,
  registerGsapPlugins,
  ScrollTrigger,
} from "@/features/motion/motion-config";

const HEADING_SELECTORS = [
  ".ritual-finder-title",
  ".shop-range-title",
  ".best-sellers-title",
  ".product-highlights-title",
  ".features-heading",
  ".home-testimonials-headline",
  ".home-faq-title",
  ".glow-stats-title",
].join(", ");

function clearSplit(heading: HTMLElement) {
  if (heading.dataset.split !== "1") {
    return;
  }
  const label = heading.getAttribute("aria-label");
  if (label) {
    heading.textContent = label;
    heading.removeAttribute("aria-label");
  }
  delete heading.dataset.split;
}

function splitWords(heading: HTMLElement): HTMLElement[] {
  clearSplit(heading);

  const accessible = heading.textContent?.trim() ?? "";
  heading.setAttribute("aria-label", accessible);

  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    if (node.textContent && node.textContent.trim()) {
      textNodes.push(node as Text);
    }
    node = walker.nextNode();
  }

  const words: HTMLElement[] = [];
  for (const textNode of textNodes) {
    const parts = textNode.textContent?.split(/(\s+)/) ?? [];
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (!part) {
        continue;
      }
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
        continue;
      }
      const mask = document.createElement("span");
      mask.className = "vd-reveal-mask";
      const word = document.createElement("span");
      word.className = "vd-reveal-word";
      word.textContent = part;
      word.setAttribute("aria-hidden", "true");
      mask.appendChild(word);
      frag.appendChild(mask);
      words.push(word);
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }

  heading.dataset.split = "1";
  return words;
}

/** M05 — masked heading word reveals, one-shot, rebuild on resize after fonts. */
export function useHeadingReveals(rootSelector = ".home-flow") {
  useEffect(() => {
    registerGsapPlugins();
    const root = document.querySelector(rootSelector);
    if (!(root instanceof HTMLElement)) {
      return;
    }

    // Word-split + GSAP is desktop-only; keep headings CSS-visible on phones/touch.
    if (prefersReducedMotion() || isMobileViewport() || isCoarsePointer()) {
      return;
    }

    let ctx: ReturnType<typeof gsap.context> | null = null;
    let resizeTimer = 0;
    let lastWidth = window.innerWidth;

    const mount = () => {
      ctx?.revert();
      ctx = gsap.context(() => {
        const headings = [...root.querySelectorAll<HTMLElement>(HEADING_SELECTORS)];
        headings.forEach((heading) => {
          const words = splitWords(heading);
          if (!words.length) {
            return;
          }
          gsap.set(words, { yPercent: 110, opacity: 0 });

          const lineCount = Math.max(1, Math.round(heading.getBoundingClientRect().height / 40));
          const wordDelay = Math.min(0.02 * words.length + 0.25 * lineCount, 1.2);

          ScrollTrigger.create({
            trigger: heading,
            start: "top 70%",
            once: true,
            onEnter: () => {
              gsap.to(words, {
                yPercent: 0,
                opacity: 1,
                duration: 0.8,
                ease: "revealEase",
                stagger: wordDelay / Math.max(words.length, 1),
              });
            },
          });
        });
      }, root);
      ScrollTrigger.refresh();
    };

    const onResize = () => {
      // Word splitting only depends on width; ignore mobile URL-bar height changes.
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        root.querySelectorAll<HTMLElement>(HEADING_SELECTORS).forEach(clearSplit);
        mount();
      }, 180);
    };

    void document.fonts?.ready.then(mount);
    if (!document.fonts) {
      mount();
    }

    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      root.querySelectorAll<HTMLElement>(HEADING_SELECTORS).forEach(clearSplit);
      ctx?.revert();
    };
  }, [rootSelector]);
}
