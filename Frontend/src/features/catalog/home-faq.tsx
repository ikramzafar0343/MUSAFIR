"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useId, useState } from "react";

import { brandName } from "@/constants/brand";
import type { StorefrontContent } from "@/constants/storefront";
import { TackAccent } from "@/features/motion/draw-parallax";
import { EASE, MOTION } from "@/features/motion/motion-config";

function FaqArrow() {
  return (
    <svg className="home-faq-cta-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8h9M8.5 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FaqItem({
  item,
  open,
  onToggle,
  reduced,
}: {
  item: StorefrontContent["faqItems"][number];
  open: boolean;
  onToggle: () => void;
  reduced: boolean;
}) {
  const panelId = useId();
  return (
    <div className={open ? "home-faq-item is-open" : "home-faq-item"}>
      <button
        type="button"
        className="home-faq-question"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>{item.question}</span>
        <span className="home-faq-toggle" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key="panel"
            className="home-faq-answer-wrap"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            {...(reduced ? {} : { exit: { height: 0, opacity: 0 } })}
            transition={
              reduced ? { duration: 0 } : { duration: MOTION.disclosureMs / 1000, ease: EASE.panel }
            }
          >
            <p className="home-faq-answer">{item.answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** M10 — Motion height/opacity FAQ disclosures. */
export function HomeFaq({ content }: { content: StorefrontContent }) {
  const [openId, setOpenId] = useState<string | null>(content.faqItems[0]?.id ?? null);
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="home-faq" aria-labelledby="home-faq-title">
      <div className="home-faq-inner">
        <div className="home-faq-intro">
          <h2 id="home-faq-title" className="home-faq-title">
            Frequently Asked{" "}
            <span className="home-faq-title-mark">
              Questions
              <span className="home-faq-dot" aria-hidden="true" />
              <TackAccent className="home-faq-underline vd-tack-accent" />
            </span>
          </h2>
          <p className="home-faq-lead">
            Everything you need to know about {brandName} menswear, orders and getting started. We&apos;re here to make
            shopping simple.
          </p>
          <Link href="/faq" className="home-faq-cta">
            <span>See all questions</span>
            <span className="home-faq-cta-icon">
              <FaqArrow />
            </span>
          </Link>
        </div>
        <div className="home-faq-list">
          {content.faqItems.map((item) => (
            <FaqItem
              key={item.id}
              item={item}
              open={openId === item.id}
              reduced={reduced}
              onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
