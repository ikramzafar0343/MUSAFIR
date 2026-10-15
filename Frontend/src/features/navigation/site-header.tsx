"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { IconBag, IconClose, IconHeart, IconMenu, IconSearch, IconUser } from "@/components/icons/icons";
import { heroCtaHref, heroCtaLabel } from "@/constants/brand";
import { MAIN_NAV, type MainNavItem } from "@/constants/navigation-ia";
import {
  DEFAULT_MEGA_MENUS,
  type MegaMenuId,
  type StorefrontMegaMenu,
  type StorefrontNavLink,
} from "@/constants/storefront";
import { MiniCart } from "@/features/cart/mini-cart";
import { RibbonMarquee } from "@/features/catalog/ribbon-marquee";
import {
  HERO_COMPACT_EVENT,
  HERO_DESKTOP_LAYOUT_MQ,
  HERO_INTRO_EVENT,
  type HeroCompactDetail,
  type HeroIntroDetail,
  readHeroCompact,
} from "@/features/motion/hero-wordmark-events";
import { EASE, MOTION } from "@/features/motion/motion-config";
import { PillCta } from "@/features/motion/pill-cta";
import { HeaderBrand } from "@/features/navigation/header-brand";
import { SearchModal } from "@/features/navigation/search-modal";
import { SiteToast } from "@/features/navigation/site-toast";
import { BAG_EVENT } from "@/lib/bag-events";
import { cn } from "@/lib/cn";
import { lockScroll } from "@/lib/scroll-lock";

type SiteHeaderProps = {
  isAuthenticated: boolean;
  cartCount: number;
  wishlistCount: number;
  megaMenus?: Record<MegaMenuId, StorefrontMegaMenu>;
  /** @deprecated Prefer megaMenus — kept for older call sites. */
  navImages?: Record<string, { src: string; tone: "blush" | "mint" }>;
  /** CMS-managed nav links — used to control visibility, labels, and order. */
  navLinks?: StorefrontNavLink[];
};

/** Merge CMS navLinks as the top-level source of truth; MAIN_NAV supplies dropdown structure. */
function mergeNavLinks(cmsLinks?: StorefrontNavLink[]): MainNavItem[] {
  if (!cmsLinks || cmsLinks.length === 0) {
    return MAIN_NAV;
  }

  const mainById = new Map(MAIN_NAV.map((item) => [item.id, item]));
  const merged: MainNavItem[] = [];

  for (const link of cmsLinks) {
    if (link.hidden) continue;
    const template = mainById.get(link.id);
    if (template) {
      merged.push({
        ...template,
        label: link.label || template.label,
        href: link.path || template.href,
      });
      continue;
    }
    merged.push({
      id: link.id,
      label: link.label,
      href: link.path,
    });
  }

  return merged.length > 0 ? merged : MAIN_NAV;
}

const INTENT_OPEN_MS = 80;
const INTENT_CLOSE_MS = 160;
const PANEL_IN_S = 0.28;
const PANEL_OUT_S = 0.18;
const CHEVRON_S = 0.22;
const MOBILE_STAGGER_S = 0.06;
const MOBILE_STAGGER_BASE_S = 0.12;
const MOBILE_STAGGER_CAP_S = 0.36;

/** Shop section prefixes (locale-stripped). */
const SHOP_SECTION_PREFIXES = ["/collections"] as const;

function formatBadge(count: number): string {
  return count > 9 ? "9+" : String(count);
}

function stripLocale(pathname: string): string {
  const raw = pathname.replace(/\/$/, "") || "/";
  const match = raw.match(/^\/(en|ar|fr|de|es)(?=\/|$)/i);
  if (!match) {
    return raw === "" ? "/" : raw;
  }
  const rest = raw.slice(match[0].length);
  return rest === "" ? "/" : rest;
}

function isHomePath(path: string): boolean {
  return path === "/" || path === "/en";
}

function hasMenu(item: MainNavItem): boolean {
  return ("groups" in item && Boolean(item.groups?.length)) || ("children" in item && Boolean(item.children?.length));
}

function isExactActive(pathname: string, href: string): boolean {
  const path = stripLocale(pathname);
  const target = stripLocale(href);
  return path === target;
}

function isSectionActive(pathname: string, item: MainNavItem): boolean {
  const path = stripLocale(pathname);
  const target = stripLocale(item.href);

  if (item.id === "navShop") {
    return SHOP_SECTION_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  }

  if (hasMenu(item)) {
    return path === target || path.startsWith(`${target}/`);
  }

  return path === target;
}

function HeaderNavLabel({ children }: { children: ReactNode }) {
  return <span className="header-nav-label">{children}</span>;
}

function HeaderUtilityVisual({ children }: { children: ReactNode }) {
  return <span className="header-utility-visual">{children}</span>;
}

function ChevronIcon({ open, reduceMotion }: { open: boolean; reduceMotion: boolean | null }) {
  return (
    <motion.span
      className="header-nav-chevron"
      aria-hidden="true"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: reduceMotion ? 0 : CHEVRON_S, ease: EASE.out }}
    >
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
        <path d="M2.5 4.25 6 7.75l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.span>
  );
}

function MenuArrowCue() {
  return (
    <span className="header-fullscreen-arrow" aria-hidden="true">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function MegaCardImage({ src, alt }: { src?: string; alt: string }) {
  const resolved = String(src ?? "").trim();
  if (!resolved) {
    return <span className="header-mega-card-placeholder" aria-hidden="true" />;
  }
  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes="(max-width: 1024px) 40vw, 220px"
      className="header-mega-card-img"
      unoptimized
    />
  );
}

export function SiteHeader({
  isAuthenticated,
  cartCount,
  wishlistCount,
  megaMenus = DEFAULT_MEGA_MENUS,
  navLinks,
}: SiteHeaderProps) {
  const pathname = usePathname() ?? "/";
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [introActive, setIntroActive] = useState(false);
  const [heroDesktop, setHeroDesktop] = useState(false);
  const [desktopOpenId, setDesktopOpenId] = useState<string | null>(null);
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(null);
  const path = pathname.replace(/\/$/, "") || "/";
  const menuId = useId();
  const megaPanelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockScrollRef = useRef<(() => void) | null>(null);
  const menuGenerationRef = useRef(0);
  const isHome = isHomePath(path);

  const clearIntentTimers = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openDesktop = useCallback(
    (id: string, immediate = false) => {
      clearIntentTimers();
      if (immediate) {
        setDesktopOpenId(id);
        return;
      }
      openTimerRef.current = setTimeout(() => {
        setDesktopOpenId(id);
        openTimerRef.current = null;
      }, INTENT_OPEN_MS);
    },
    [clearIntentTimers],
  );

  const closeDesktop = useCallback(
    (immediate = false) => {
      clearIntentTimers();
      if (immediate) {
        setDesktopOpenId(null);
        return;
      }
      closeTimerRef.current = setTimeout(() => {
        setDesktopOpenId(null);
        closeTimerRef.current = null;
      }, INTENT_CLOSE_MS);
    },
    [clearIntentTimers],
  );

  const releaseBodyLock = useCallback((generation: number) => {
    if (generation !== menuGenerationRef.current) {
      return;
    }
    unlockScrollRef.current?.();
    unlockScrollRef.current = null;
  }, []);

  useEffect(() => {
    const onBag = () => setBagOpen(true);
    window.addEventListener(BAG_EVENT, onBag);
    return () => window.removeEventListener(BAG_EVENT, onBag);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(HERO_DESKTOP_LAYOUT_MQ);
    const sync = () => setHeroDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const onIntro = (event: Event) => {
      const detail = (event as CustomEvent<HeroIntroDetail>).detail;
      setIntroActive(Boolean(detail?.active));
    };
    window.addEventListener(HERO_INTRO_EVENT, onIntro);
    return () => window.removeEventListener(HERO_INTRO_EVENT, onIntro);
  }, []);

  useEffect(() => {
    if (isHome && heroDesktop) {
      const onCompact = (event: Event) => {
        const detail = (event as CustomEvent<HeroCompactDetail>).detail;
        setScrolled(Boolean(detail?.compact));
      };
      const current = readHeroCompact();
      const frame = window.requestAnimationFrame(() => {
        if (current !== null) {
          setScrolled(current);
        }
      });
      window.addEventListener(HERO_COMPACT_EVENT, onCompact);
      return () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener(HERO_COMPACT_EVENT, onCompact);
      };
    }

    const hero = document.querySelector(".home-hero-panel");
    const threshold =
      isHome && hero instanceof HTMLElement ? Math.max(160, hero.getBoundingClientRect().height * 0.55) : 48;
    // Only touch state on the crossing, not on every scroll event.
    let past = window.scrollY > threshold;
    const onScroll = () => {
      const next = window.scrollY > threshold;
      if (next === past) {
        return;
      }
      past = next;
      setScrolled(next);
    };
    const frame = window.requestAnimationFrame(() => {
      setScrolled(past);
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname, isHome, heroDesktop]);

  const [navEpoch, setNavEpoch] = useState(pathname);
  if (navEpoch !== pathname) {
    setNavEpoch(pathname);
    setOpen(false);
    setSearchOpen(false);
    setBagOpen(false);
    setDesktopOpenId(null);
    setMobileOpenId(null);
  }

  useEffect(() => {
    clearIntentTimers();
  }, [pathname, clearIntentTimers]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const generation = ++menuGenerationRef.current;
    if (!unlockScrollRef.current) {
      unlockScrollRef.current = lockScroll();
    }

    const menu = menuRef.current;
    const focusables = () =>
      menu
        ? [...menu.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")].filter(
            (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
          )
        : [];

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !menu) {
        return;
      }
      const nodes = focusables();
      if (nodes.length < 2) {
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setOpen(false);
        releaseBodyLock(generation);
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.requestAnimationFrame(() => {
      const closeBtn = menu?.querySelector<HTMLElement>(".header-fullscreen-close");
      (closeBtn ?? focusables()[0])?.focus();
    });

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open, releaseBodyLock]);

  useEffect(
    () => () => {
      unlockScrollRef.current?.();
      unlockScrollRef.current = null;
      clearIntentTimers();
    },
    [clearIntentTimers],
  );

  useEffect(() => {
    if (!desktopOpenId) {
      return undefined;
    }

    const onPointerDown = (event: PointerEvent) => {
      const root = desktopNavRef.current;
      if (!root) {
        return;
      }
      if (event.target instanceof Node && !root.contains(event.target)) {
        closeDesktop(true);
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        const activeId = desktopOpenId;
        closeDesktop(true);
        const trigger = document.querySelector<HTMLElement>(`[data-header-disclosure="${activeId}"]`);
        trigger?.focus();
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [desktopOpenId, closeDesktop]);

  const overlay = isHome && !scrolled && !open && !introActive;
  const tone = overlay ? "site-header-light" : "site-header-dark";
  const logoTheme = overlay ? "light" : "dark";
  const badgeCount = cartCount;
  const desktopItems = mergeNavLinks(navLinks);
  const headerTheme = overlay ? "cream" : "forest";
  const megaCandidate =
    desktopOpenId && desktopOpenId in megaMenus
      ? megaMenus[desktopOpenId as MegaMenuId]
      : undefined;
  const mega = megaCandidate && megaCandidate.cards.length > 0 ? megaCandidate : undefined;
  const activeMegaItem = desktopOpenId ? desktopItems.find((item) => item.id === desktopOpenId) : undefined;

  const onDropdownBlur = (event: ReactFocusEvent<HTMLElement>) => {
    const root = desktopNavRef.current;
    const next = event.relatedTarget;
    if (next instanceof Node && root?.contains(next)) {
      clearIntentTimers();
      return;
    }
    closeDesktop(false);
  };

  const onDisclosureKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (desktopOpenId === id) {
        closeDesktop(true);
      } else {
        openDesktop(id, true);
      }
    }
  };

  return (
    <header
      data-musafir-header=""
      data-header-theme={headerTheme}
      className={cn(
        "site-header",
        isHome && "site-header--home",
        overlay && "site-header--overlay",
        scrolled || open ? "site-header-scrolled site-header-compact" : "site-header-transparent",
        open && "site-header--menu-open",
        desktopOpenId && "site-header--mega-open",
      )}
      suppressHydrationWarning
    >
      {scrolled || open ? <div className="site-header-frost" aria-hidden="true" /> : null}
      <div ref={desktopNavRef} className="site-header-desktop-layer">
      <div className="site-header-shell site-header-shell--voldog">
        <button
          ref={toggleRef}
          type="button"
          className={cn(
            "site-header-menu-btn header-menu-toggle site-header-menu-btn--start",
            overlay && "is-overlay",
            open && "is-open",
          )}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="header-menu-toggle-visual" aria-hidden="true">
            {open ? <IconClose /> : <IconMenu />}
          </span>
        </button>

        <nav
          className="site-header-nav site-header-nav--start"
          aria-label="Primary navigation"
        >
          {desktopItems.map((item) => {
            const exact = isExactActive(pathname, item.href);
            const section = isSectionActive(pathname, item);
            const menu = hasMenu(item);

            if (!menu) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn("site-header-link", tone)}
                  aria-current={exact ? "page" : undefined}
                >
                  <HeaderNavLabel>{item.label}</HeaderNavLabel>
                </Link>
              );
            }

            const isOpen = desktopOpenId === item.id;

            return (
              <div
                key={item.id}
                className="site-header-dropdown"
                onMouseEnter={() => openDesktop(item.id)}
                onMouseLeave={() => closeDesktop(false)}
              >
                <button
                  type="button"
                  className={cn("site-header-link site-header-disclosure", tone)}
                  data-header-disclosure={item.id}
                  data-current-section={section && !exact ? "true" : undefined}
                  aria-expanded={isOpen}
                  aria-controls={megaPanelId}
                  aria-haspopup="true"
                  onClick={() => (isOpen ? closeDesktop(true) : openDesktop(item.id, true))}
                  onKeyDown={(event) => onDisclosureKeyDown(event, item.id)}
                  onFocus={() => openDesktop(item.id)}
                  onBlur={onDropdownBlur}
                >
                  <HeaderNavLabel>
                    {item.label}
                    <ChevronIcon open={isOpen} reduceMotion={reduceMotion} />
                  </HeaderNavLabel>
                </button>
              </div>
            );
          })}
        </nav>

        <div className="site-header-brand">
          <HeaderBrand theme={open ? "light" : logoTheme} />
        </div>

        <div className="site-header-end">
          <div className={cn("site-header-icons", tone, open && "is-menu-hidden")}>
            <button
              type="button"
              className="site-header-icon-btn header-utility site-header-utility--search"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(true)}
            >
              <HeaderUtilityVisual>
                <IconSearch />
              </HeaderUtilityVisual>
            </button>
            <Link
              href="/wishlist"
              className="site-header-icon-wrap site-header-icon-btn header-utility site-header-utility--secondary"
              aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : "Wishlist"}
            >
              <HeaderUtilityVisual>
                <IconHeart />
              </HeaderUtilityVisual>
              {wishlistCount > 0 ? <span className="site-header-icon-badge">{formatBadge(wishlistCount)}</span> : null}
            </Link>
            <Link
              href={isAuthenticated ? "/account" : "/login"}
              className="site-header-icon-btn header-utility"
              aria-label={isAuthenticated ? "Account" : "Sign in"}
            >
              <HeaderUtilityVisual>
                <IconUser />
              </HeaderUtilityVisual>
            </Link>
            <button
              type="button"
              className="site-header-icon-wrap site-header-icon-btn header-utility"
              aria-label={badgeCount > 0 ? `Cart, ${badgeCount} items` : "Cart"}
              aria-expanded={bagOpen}
              onClick={() => setBagOpen(true)}
            >
              <HeaderUtilityVisual>
                <IconBag />
              </HeaderUtilityVisual>
              {badgeCount > 0 ? <span className="site-header-icon-badge">{formatBadge(badgeCount)}</span> : null}
            </button>
          </div>

          <PillCta href={heroCtaHref} className={cn("site-header-shop-cta header-pill-cta", open && "is-menu-hidden")}>
            {heroCtaLabel}
          </PillCta>

          <button
            type="button"
            className={cn(
              "site-header-menu-btn header-menu-toggle site-header-menu-btn--end",
              overlay && "is-overlay",
              open && "is-open is-menu-hidden",
            )}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="header-menu-toggle-visual" aria-hidden="true">
              {open ? <IconClose /> : <IconMenu />}
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mega && activeMegaItem && desktopOpenId ? (
          <motion.div
            id={megaPanelId}
            key={`mega-${desktopOpenId}`}
            className="header-mega-panel"
            role="region"
            aria-label={`${activeMegaItem.label} menu`}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: reduceMotion ? 0 : PANEL_IN_S, ease: EASE.out },
            }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : 8,
              transition: { duration: reduceMotion ? 0 : PANEL_OUT_S, ease: EASE.out },
            }}
            onMouseEnter={() => {
              clearIntentTimers();
              setDesktopOpenId(desktopOpenId);
            }}
            onMouseLeave={() => closeDesktop(false)}
            onFocusCapture={() => {
              clearIntentTimers();
              setDesktopOpenId(desktopOpenId);
            }}
            onBlurCapture={onDropdownBlur}
          >
            <div className="header-mega-inner">
              <div className="header-mega-top">
                <h2 className="header-mega-headline">{mega.headline}</h2>
                <Link
                  href={activeMegaItem.href}
                  className="header-mega-view-all"
                  onClick={() => closeDesktop(true)}
                >
                  View all
                </Link>
              </div>
              <ul className="header-mega-grid">
                {mega.cards.map((card) => (
                  <li key={card.id}>
                    <Link
                      href={card.href}
                      className="header-mega-card"
                      onClick={() => closeDesktop(true)}
                    >
                      <span className="header-mega-card-media">
                        <MegaCardImage src={card.image} alt="" />
                      </span>
                      <span className="header-mega-card-label">{card.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      </div>

      <AnimatePresence
        onExitComplete={() => {
          releaseBodyLock(menuGenerationRef.current);
        }}
      >
        {open ? (
          <motion.div
            ref={menuRef}
            id={menuId}
            key="fullscreen-menu"
            className="header-fullscreen-menu"
            initial={reduceMotion ? false : { clipPath: "inset(0 0 100% 0)" }}
            animate={{
              clipPath: "inset(0 0 0% 0)",
              transition: reduceMotion
                ? { duration: 0 }
                : { duration: MOTION.menuInMs / 1000, ease: EASE.menuIn },
            }}
            exit={{
              clipPath: "inset(0 0 100% 0)",
              transition: reduceMotion
                ? { duration: 0 }
                : { duration: MOTION.menuOutMs / 1000, ease: EASE.menuOut },
            }}
          >
            <button
              type="button"
              className="header-fullscreen-close"
              aria-label="Close menu"
              onClick={() => {
                setOpen(false);
                toggleRef.current?.focus();
              }}
            >
              <IconClose />
            </button>

            <nav className="header-fullscreen-nav" aria-label="Mobile navigation">
              <ul className="header-fullscreen-list">
                {mergeNavLinks(navLinks).map((item, i) => {
                  const expandable = hasMenu(item);
                  const expanded = mobileOpenId === item.id;
                  const exact = isExactActive(pathname, item.href);
                  const section = isSectionActive(pathname, item);
                  const active = exact || section;
                  const delay = reduceMotion
                    ? 0
                    : Math.min(MOBILE_STAGGER_BASE_S + i * MOBILE_STAGGER_S, MOBILE_STAGGER_CAP_S);
                  return (
                    <motion.li
                      key={item.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay, duration: reduceMotion ? 0 : 0.4, ease: EASE.out }}
                      className="header-fullscreen-item"
                    >
                      {expandable ? (
                        <>
                          <button
                            type="button"
                            className={cn("header-fullscreen-link", active && "is-active")}
                            aria-expanded={expanded}
                            onClick={() => setMobileOpenId((id) => (id === item.id ? null : item.id))}
                          >
                            {active ? <MenuArrowCue /> : null}
                            <span>{item.label}</span>
                          </button>
                          {expanded ? (
                            <div className="header-fullscreen-panel">
                              <Link
                                href={item.href}
                                className="header-fullscreen-sublink"
                                onClick={() => setOpen(false)}
                              >
                                View all
                              </Link>
                              {"groups" in item && item.groups
                                ? item.groups.map((group) => (
                                    <div key={group.id} className="header-fullscreen-group">
                                      <p className="header-fullscreen-group-label">{group.label}</p>
                                      {group.links.map((link) => (
                                        <Link
                                          key={link.id}
                                          href={link.href}
                                          className="header-fullscreen-sublink"
                                          onClick={() => setOpen(false)}
                                        >
                                          {link.label}
                                        </Link>
                                      ))}
                                    </div>
                                  ))
                                : null}
                              {"children" in item && item.children
                                ? item.children.map((link) => (
                                    <Link
                                      key={link.id}
                                      href={link.href}
                                      className="header-fullscreen-sublink"
                                      onClick={() => setOpen(false)}
                                    >
                                      {link.label}
                                    </Link>
                                  ))
                                : null}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn("header-fullscreen-link", active && "is-active")}
                          aria-current={exact ? "page" : undefined}
                          onClick={() => setOpen(false)}
                        >
                          {active ? <MenuArrowCue /> : null}
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            <div className="header-fullscreen-ribbon">
              <RibbonMarquee tone="lime" pathId="headerMenuRibbon" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MiniCart open={bagOpen} onClose={() => setBagOpen(false)} />
      <SiteToast />
    </header>
  );
}
