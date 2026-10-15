"use client";

import { useCallback, useId, useRef } from "react";

import { brandName } from "@/constants/brand";
import {
  HOME_TESTIMONIALS,
  HOME_TESTIMONIALS_BADGE,
  HOME_TESTIMONIALS_COUNT,
  HOME_TESTIMONIALS_HEADLINE,
  HOME_TESTIMONIALS_RATING,
  HOME_TESTIMONIALS_RIBBON,
} from "@/constants/site";
import { ProgressCurve } from "@/features/motion/progress-curve";

function Stars({ value }: { value: number }) {
  return (
    <span className="home-testimonials-stars" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < value ? "is-on" : undefined} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

function Sparkles() {
  return (
    <svg className="home-testimonials-sparkles" viewBox="0 0 48 36" fill="none" aria-hidden="true">
      <path d="M10 28 L16 8" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M24 30 L28 6" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M36 26 L44 10" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

function DownArrow() {
  return (
    <svg className="home-testimonials-down" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5v12.5M6.5 12.5 12 18l5.5-5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d={dir === "prev" ? "M12 4.5 6.5 10 12 15.5" : "M8 4.5 13.5 10 8 15.5"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const RIBBON_X0 = 48;
const RIBBON_X1 = 1392;
const RIBBON_MID_Y = 130;
const RIBBON_AMP = 34;
const RIBBON_PERIOD = 520;
const RIBBON_STEP = 18;

function sampleRibbonWave(x: number): number {
  return RIBBON_MID_Y + RIBBON_AMP * Math.sin((2 * Math.PI * (x - RIBBON_X0)) / RIBBON_PERIOD);
}

/** Continuous sine spine — keeps band thickness and type centered along the curve. */
function buildReviewRibbonGuide(): string {
  const points: Array<readonly [number, number]> = [];
  for (let x = RIBBON_X0; x <= RIBBON_X1; x += RIBBON_STEP) {
    points.push([x, sampleRibbonWave(x)]);
  }
  const first = points[0];
  if (!first) {
    return "";
  }
  let path = `M${first[0].toFixed(1)} ${first[1].toFixed(1)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const ahead = points[index + 2] ?? points[index + 1];
    if (!previous || !current || !next || !ahead) {
      continue;
    }
    const c1x = current[0] + (next[0] - previous[0]) / 6;
    const c1y = current[1] + (next[1] - previous[1]) / 6;
    const c2x = next[0] - (ahead[0] - current[0]) / 6;
    const c2y = next[1] - (ahead[1] - current[1]) / 6;
    path += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${next[0].toFixed(1)} ${next[1].toFixed(1)}`;
  }
  return path;
}

const REVIEW_RIBBON_GUIDE = buildReviewRibbonGuide();

function ReviewRibbon({ text }: { text: string }) {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, "");
  const pathId = `testimonial-ribbon-${safeId}`;
  const maskId = `testimonial-ribbon-mask-${safeId}`;
  const copy = `${text}  ·  `.repeat(10);

  return (
    <div className="home-testimonials-ribbon" aria-hidden="true">
      <svg
        className="home-testimonials-ribbon-svg"
        viewBox="0 0 1440 240"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <path id={pathId} d={REVIEW_RIBBON_GUIDE} fill="none" />
          {/* Clip type to the stroked band so ends read as caps, not mid-letter cuts. */}
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width="1440" height="240" fill="black" />
            <use href={`#${pathId}`} stroke="white" strokeWidth="58" strokeLinecap="round" fill="none" />
          </mask>
        </defs>
        <use
          href={`#${pathId}`}
          className="home-testimonials-ribbon-band"
          strokeWidth="64"
        />
        <g mask={`url(#${maskId})`}>
          <text className="home-testimonials-ribbon-type" dominantBaseline="central">
            <textPath href={`#${pathId}`} startOffset="0" spacing="auto">
              {copy}
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
}

export function HomeTestimonials() {
  const viewportRef = useRef<HTMLDivElement>(null);

  const scrollByCard = useCallback((dir: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const card = viewport.querySelector<HTMLElement>(".home-testimonials-card");
    const step = (card?.offsetWidth ?? viewport.clientWidth * 0.8) + 20;
    viewport.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  return (
    <section className="home-testimonials" aria-labelledby="home-testimonials-title">
      <ProgressCurve from="white" to="cream" />
      <div className="home-testimonials-intro">
        <ReviewRibbon text={HOME_TESTIMONIALS_RIBBON} />
        <p className="home-testimonials-badge">{HOME_TESTIMONIALS_BADGE}</p>
        <div className="home-testimonials-headline-wrap">
          <h2 id="home-testimonials-title" className="home-testimonials-headline">
            {HOME_TESTIMONIALS_HEADLINE}
          </h2>
          <Sparkles />
        </div>
        <DownArrow />
      </div>

      <div className="home-testimonials-carousel">
        <button
          type="button"
          className="home-testimonials-nav home-testimonials-nav--prev"
          aria-label="Previous reviews"
          onClick={() => scrollByCard(-1)}
        >
          <Chevron dir="prev" />
        </button>

        <div ref={viewportRef} className="home-testimonials-viewport" tabIndex={0}>
          <ul className="home-testimonials-track">
            {HOME_TESTIMONIALS.map((item) => (
              <li key={item.id} className="home-testimonials-card">
                <header className="home-testimonials-card-head">
                  <span className="home-testimonials-avatar" style={{ background: item.tone }}>
                    {item.initials}
                  </span>
                  <div className="home-testimonials-meta">
                    <p className="home-testimonials-name">{item.name}</p>
                    <p className="home-testimonials-when">{item.when}</p>
                  </div>
                </header>
                <Stars value={item.rating} />
                <p className="home-testimonials-body">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="home-testimonials-nav home-testimonials-nav--next"
          aria-label="Next reviews"
          onClick={() => scrollByCard(1)}
        >
          <Chevron dir="next" />
        </button>
      </div>

      <div className="home-testimonials-summary">
        <p className="home-testimonials-score">
          <span>{HOME_TESTIMONIALS_RATING.toFixed(1)}</span>
          <Stars value={5} />
        </p>
        <p className="home-testimonials-count">Based on {HOME_TESTIMONIALS_COUNT} reviews</p>
        <p className="home-testimonials-powered">Loved by the {brandName} community</p>
      </div>
      <ProgressCurve from="cream" to="white" />
    </section>
  );
}
